import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Coupon, InventoryItem, Order, Product, User, WalletTransaction } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth";
import { notify, roundMoney } from "@/lib/store";
import { fulfillOrder } from "@/lib/fulfillment";
import Stripe from "stripe";

function makeOrderNumber() { return `ND-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`; }

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in before checking out." }, { status: 401 });
  try {
    await dbConnect();
    const body = await request.json();
    const rawItems = Array.isArray(body.items) ? body.items : [];
    if (!rawItems.length || rawItems.length > 20) return NextResponse.json({ error: "Your cart is empty or too large." }, { status: 400 });
    const quantities = new Map<string, number>();
    for (const row of rawItems) {
      const id = String(row.productId || "");
      const quantity = Math.max(1, Math.min(10, Number(row.quantity) || 1));
      quantities.set(id, (quantities.get(id) || 0) + quantity);
    }
    const products = await Product.find({ _id: { $in: [...quantities.keys()] }, isActive: true });
    if (products.length !== quantities.size) return NextResponse.json({ error: "One or more products are no longer available." }, { status: 409 });
    const items = [];
    let subtotal = 0;
    for (const product of products) {
      const quantity = quantities.get(String(product._id)) || 1;
      if (product.deliveryMode === "automatic") {
        const stock = await InventoryItem.countDocuments({ productId: product._id, status: "available" });
        if (stock < quantity) return NextResponse.json({ error: `Not enough stock for ${product.title}. Available: ${stock}.` }, { status: 409 });
      }
      subtotal += Number(product.price) * quantity;
      items.push({ productId: product._id, title: product.title, slug: product.slug, image: product.image, quantity, unitPrice: Number(product.price), deliveryMode: product.deliveryMode, deliveredData: [] });
    }
    subtotal = roundMoney(subtotal);
    let discount = 0;
    let coupon: any = null;
    const code = String(body.couponCode || "").trim().toUpperCase();
    if (code) {
      coupon = await Coupon.findOne({ code, active: true });
      const now = new Date();
      if (!coupon || (coupon.startsAt && coupon.startsAt > now) || (coupon.endsAt && coupon.endsAt < now) || (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) || subtotal < coupon.minOrder) return NextResponse.json({ error: "This coupon is invalid, expired, or not eligible." }, { status: 400 });
      if (coupon.targetType === "users" && !coupon.targetIds.some((id: any) => String(id) === user._id)) return NextResponse.json({ error: "This coupon is not assigned to your account." }, { status: 403 });
      if (coupon.targetType === "products" && !items.some((item: any) => coupon.targetIds.some((id: any) => String(id) === String(item.productId)))) return NextResponse.json({ error: "This coupon does not apply to these products." }, { status: 400 });
      if (coupon.targetType === "categories") {
        const selected = await Product.find({ _id: { $in: items.map((item: any) => item.productId) } }).select("categoryId");
        if (!selected.some((p: any) => coupon.targetIds.some((id: any) => String(id) === String(p.categoryId)))) return NextResponse.json({ error: "This coupon does not apply to these products." }, { status: 400 });
      }
      discount = coupon.discountType === "percentage" ? subtotal * coupon.value / 100 : coupon.value;
      if (coupon.maxDiscount > 0) discount = Math.min(discount, coupon.maxDiscount);
      discount = roundMoney(Math.min(discount, subtotal));
    }
    const total = roundMoney(subtotal - discount);
    const paymentMethod = ["wallet", "manual", "stripe"].includes(body.paymentMethod) ? body.paymentMethod : "manual";
    if (paymentMethod === "stripe" && !process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: "Online card checkout is not configured. Add STRIPE_SECRET_KEY to enable it." }, { status: 503 });
    if (paymentMethod === "wallet" && total <= 0) return NextResponse.json({ error: "The order total must be greater than zero." }, { status: 400 });

    let debitedUser: any = null;
    if (paymentMethod === "wallet") {
      debitedUser = await User.findOneAndUpdate({ _id: user._id, walletBalance: { $gte: total }, status: "active" }, { $inc: { walletBalance: -total } }, { new: true });
      if (!debitedUser) return NextResponse.json({ error: "Your wallet balance is not enough." }, { status: 400 });
    }
    let order: any;
    try {
      order = await Order.create({
        orderNumber: makeOrderNumber(), userId: user._id, items, subtotal, discount, total,
        currency: products[0]?.currency || process.env.NEXT_PUBLIC_STORE_CURRENCY || "USD",
        couponCode: coupon?.code || "", paymentMethod,
        paymentStatus: paymentMethod === "wallet" ? "paid" : "pending",
        status: paymentMethod === "wallet" ? "processing" : "awaiting_payment",
        paymentReference: String(body.paymentReference || "").slice(0, 180),
        paidAt: paymentMethod === "wallet" ? new Date() : undefined
      });
    } catch (error) {
      if (debitedUser) await User.updateOne({ _id: user._id }, { $inc: { walletBalance: total } });
      throw error;
    }
    if (debitedUser) await WalletTransaction.create({ userId: user._id, type: "debit", amount: total, balanceAfter: debitedUser.walletBalance, reference: order.orderNumber, note: "Payment for digital order" });
    if (coupon) await Coupon.updateOne({ _id: coupon._id }, { $inc: { usedCount: 1 } });

    if (paymentMethod === "wallet") {
      await Product.updateMany({ _id: { $in: products.map((p: any) => p._id) } }, { $inc: { salesCount: 1 } });
      const fulfilled = await fulfillOrder(String(order._id));
      await notify({ userId: user._id, title: "Order placed successfully", body: `Your order ${order.orderNumber} has been paid using your wallet.`, type: "payment", href: `/orders/${order._id}` });
      return NextResponse.json({ orderId: String(order._id), orderNumber: order.orderNumber, status: fulfilled?.status || "processing" }, { status: 201 });
    }
    if (paymentMethod === "stripe") {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
      const site = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        success_url: `${site}/orders/${order._id}?payment=success`,
        cancel_url: `${site}/checkout?payment=cancelled`,
        customer_email: user.email,
        metadata: { orderId: String(order._id) },
        line_items: [{ quantity: 1, price_data: { currency: String(order.currency).toLowerCase(), unit_amount: Math.round(total * 100), product_data: { name: `Order ${order.orderNumber}`, description: `${items.length} digital item(s)` } } }]
      });
      order.stripeSessionId = session.id;
      await order.save();
      return NextResponse.json({ orderId: String(order._id), checkoutUrl: session.url }, { status: 201 });
    }
    const admins = await User.find({ role: "admin", status: "active" }).select("_id");
    await notify({ targetUserIds: admins.map((a: any) => a._id), title: "New order awaiting payment", body: `Order ${order.orderNumber} was submitted for manual payment.`, type: "order", href: "/admin/orders" });
    await notify({ userId: user._id, title: "Order submitted", body: `Order ${order.orderNumber} is waiting for payment confirmation.`, type: "order", href: `/orders/${order._id}` });
    return NextResponse.json({ orderId: String(order._id), orderNumber: order.orderNumber, status: "awaiting_payment" }, { status: 201 });
  } catch (error) {
    console.error("checkout", error);
    return NextResponse.json({ error: "Unable to place your order. Please try again." }, { status: 500 });
  }
}

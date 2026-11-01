import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Coupon, InventoryItem, Order, Product, User, WalletTransaction } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth";
import { notify, roundMoney } from "@/lib/store";
import { fulfillOrder } from "@/lib/fulfillment";
import Stripe from "stripe";

function makeOrderNumber() { return `ND-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`; }

function ids(value: unknown): string[] {
  return Array.isArray(value) ? value.map((id) => String(id)) : [];
}

function eligibleSubtotalForCoupon(coupon: any, userId: string, items: any[], products: any[]) {
  const userTargets = ids(coupon.targetUserIds);
  const legacyUserTargets = coupon.targetType === "users" ? ids(coupon.targetIds) : [];
  const allowedUsers = userTargets.length ? userTargets : legacyUserTargets;
  if (allowedUsers.length && !allowedUsers.includes(userId)) return 0;

  let productTargets = ids(coupon.targetProductIds);
  let categoryTargets = ids(coupon.targetCategoryIds);
  const legacyProductTarget = !productTargets.length && !categoryTargets.length && coupon.targetType === "products";
  const legacyCategoryTarget = !productTargets.length && !categoryTargets.length && coupon.targetType === "categories";
  if (legacyProductTarget) productTargets = ids(coupon.targetIds);
  if (legacyCategoryTarget) categoryTargets = ids(coupon.targetIds);

  const restrictProducts = coupon.targetAllProducts === false || legacyProductTarget || legacyCategoryTarget;
  const productMap = new Map<string, any>(products.map((product: any) => [String(product._id), product]));
  const productSet = new Set(productTargets);
  const categorySet = new Set(categoryTargets);

  return items.reduce((sum: number, item: any) => {
    const product = productMap.get(String(item.productId));
    if (!product) return sum;
    const categoryId = String(product.categoryId?._id || product.categoryId || "");
    const matchesProduct = !restrictProducts || productSet.has(String(item.productId)) || categorySet.has(categoryId);
    return matchesProduct ? sum + Number(item.unitPrice || 0) * Number(item.quantity || 0) : sum;
  }, 0);
}

function discountForSubtotal(coupon: any, eligibleSubtotal: number) {
  if (eligibleSubtotal <= 0) return 0;
  let amount = coupon.discountType === "percentage"
    ? eligibleSubtotal * Number(coupon.value || 0) / 100
    : Number(coupon.value || 0);
  if (Number(coupon.maxDiscount || 0) > 0) amount = Math.min(amount, Number(coupon.maxDiscount));
  return roundMoney(Math.min(amount, eligibleSubtotal));
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in before checking out." }, { status: 401 });
  try {
    await dbConnect();
    const body = await request.json();
    const rawItems = Array.isArray(body.items) ? body.items : [];
    if (!rawItems.length || rawItems.length > 20) return NextResponse.json({ error: "Your cart is empty or too large." }, { status: 400 });
    const quantities = new Map<string, { productId: string; variant: string; quantity: number }>();
    for (const row of rawItems) {
      const id = String(row.productId || "");
      const variant = String(row.variant || "").trim().slice(0, 60);
      const key = `${id}::${variant}`;
      const quantity = Math.max(1, Math.min(10, Number(row.quantity) || 1));
      const current = quantities.get(key);
      quantities.set(key, { productId: id, variant, quantity: (current?.quantity || 0) + quantity });
    }
    const productIds = [...new Set([...quantities.values()].map((line) => line.productId))];
    const products = await Product.find({ _id: { $in: productIds }, isActive: true });
    if (products.length !== productIds.length) return NextResponse.json({ error: "One or more products are no longer available." }, { status: 409 });
    const items = [];
    let subtotal = 0;
    for (const product of products) {
      const productLines = [...quantities.values()].filter((line) => line.productId === String(product._id));
      const totalQuantity = productLines.reduce((sum, line) => sum + line.quantity, 0);
      if (product.deliveryMode === "automatic") {
        const stock = await InventoryItem.countDocuments({ productId: product._id, status: "available" });
        if (stock < totalQuantity) return NextResponse.json({ error: `Not enough stock for ${product.title}. Available: ${stock}.` }, { status: 409 });
      }
      for (const line of productLines) {
        const colors = Array.isArray((product as any).colors) ? (product as any).colors : [];
        if (colors.length && !colors.some((color: any) => color.name === line.variant)) return NextResponse.json({ error: `Choose a valid color for ${product.title}.` }, { status: 400 });
        if (!colors.length && line.variant) return NextResponse.json({ error: `The selected option for ${product.title} is no longer available.` }, { status: 409 });
        const personalDiscountPercent = user.role === "customer" ? Math.min(100, Math.max(0, Number(user.discountPercent || 0))) : 0;
        const unitPrice = roundMoney(Number(product.price) * (1 - personalDiscountPercent / 100));
        subtotal += unitPrice * line.quantity;
        items.push({ productId: product._id, title: product.title, slug: product.slug, image: product.image, variant: line.variant, quantity: line.quantity, unitPrice, deliveryMode: product.deliveryMode, deliveredData: [] });
      }
    }
    subtotal = roundMoney(subtotal);
    let discount = 0;
    let coupon: any = null;
    const code = String(body.couponCode || "").trim().toUpperCase();
    const now = new Date();

    if (code) {
      coupon = await Coupon.findOne({ code, active: true });
      if (!coupon || (coupon.startsAt && coupon.startsAt > now) || (coupon.endsAt && coupon.endsAt < now) || (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) || subtotal < Number(coupon.minOrder || 0)) {
        return NextResponse.json({ error: "This coupon is invalid, expired, or not eligible." }, { status: 400 });
      }
      const eligibleSubtotal = roundMoney(eligibleSubtotalForCoupon(coupon, user._id, items, products));
      if (eligibleSubtotal <= 0) return NextResponse.json({ error: "This discount is not assigned to your account or cart items." }, { status: 400 });
      discount = discountForSubtotal(coupon, eligibleSubtotal);
    } else {
      const automaticCoupons = await Coupon.find({ active: true, autoApply: true }).sort({ value: -1 }).lean();
      let bestDiscount = 0;
      for (const campaign of automaticCoupons as any[]) {
        if ((campaign.startsAt && campaign.startsAt > now) || (campaign.endsAt && campaign.endsAt < now) || (campaign.usageLimit > 0 && campaign.usedCount >= campaign.usageLimit) || subtotal < Number(campaign.minOrder || 0)) continue;
        const eligibleSubtotal = roundMoney(eligibleSubtotalForCoupon(campaign, user._id, items, products));
        const campaignDiscount = discountForSubtotal(campaign, eligibleSubtotal);
        if (campaignDiscount > bestDiscount) {
          bestDiscount = campaignDiscount;
          coupon = campaign;
        }
      }
      discount = bestDiscount;
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

    if (paymentMethod === "wallet") {
      if (coupon) await Coupon.updateOne({ _id: coupon._id }, { $inc: { usedCount: 1 } });
      await Product.updateMany({ _id: { $in: products.map((p: any) => p._id) } }, { $inc: { salesCount: 1 } });
      const fulfilled = await fulfillOrder(String(order._id));
      await notify({ userId: user._id, title: "Order placed successfully", body: `Your order ${order.orderNumber} has been paid using your wallet.`, type: "payment", href: `/orders/${order._id}` });
      const admins = await User.find({ role: "admin", status: "active" }).select("_id");
      await notify({ targetUserIds: admins.map((admin: any) => admin._id), title: "New paid order", body: `Order ${order.orderNumber} was paid from the customer wallet.`, type: "order", href: "/admin/orders" });
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

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { dbConnect } from "@/lib/db";
import { Coupon, Order, User, WalletTransaction } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth";
import { fulfillOrder } from "@/lib/fulfillment";
import { notify } from "@/lib/store";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  await dbConnect();
  const { id } = await context.params;
  const order = await Order.findById(id).populate("userId", "name email").lean();
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (user.role !== "admin" && String((order.userId as any)?._id || order.userId) !== user._id) return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  return NextResponse.json({ order });
}
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (user?.role !== "admin") return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  await dbConnect();
  const { id } = await context.params;
  const body = await request.json();
  const order = await Order.findById(id);
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (body.action === "approve-payment") {
    if (order.paymentMethod !== "manual" || order.paymentStatus !== "pending") return NextResponse.json({ error: "Only pending manual-transfer payments can be approved here." }, { status: 400 });
    order.paymentStatus = "paid"; order.status = "processing"; order.paidAt = new Date(); await order.save();
    if (order.couponCode) await Coupon.updateOne({ code: order.couponCode }, { $inc: { usedCount: 1 } });
    const result = await fulfillOrder(String(order._id));
    await notify({ userId: order.userId, title: "Payment approved", body: `Your payment for ${order.orderNumber} has been approved.`, type: "payment", href: `/orders/${order._id}` });
    return NextResponse.json({ order: result });
  }
  if (body.action === "ship") {
    if (order.paymentStatus !== "paid") return NextResponse.json({ error: "Payment must be confirmed before shipping." }, { status: 400 });
    if (!["processing", "delivered"].includes(order.status)) return NextResponse.json({ error: "Only new paid orders can be moved to shipping." }, { status: 409 });
    order.status = "shipped";
    order.shippedAt = new Date();
    await order.save();
    await notify({
      userId: order.userId,
      title: "Your order has been shipped",
      body: `Order ${order.orderNumber} has been confirmed as shipped. You can follow its status from your account.`,
      type: "delivery",
      href: `/orders/${order._id}`
    });
    return NextResponse.json({ order });
  }
  if (body.action === "complete") {
    if (order.status !== "shipped") return NextResponse.json({ error: "Only shipped orders can be completed." }, { status: 409 });
    order.status = "completed";
    order.completedAt = new Date();
    await order.save();
    await notify({
      userId: order.userId,
      title: "Your order is complete",
      body: `Order ${order.orderNumber} has been marked as completed. Thank you for your purchase.`,
      type: "delivery",
      href: `/orders/${order._id}`
    });
    return NextResponse.json({ order });
  }
  if (body.action === "retry-delivery") {
    if (order.paymentStatus !== "paid") return NextResponse.json({ error: "Payment must be confirmed before delivery." }, { status: 400 });
    const result = await fulfillOrder(String(order._id));
    return NextResponse.json({ order: result });
  }
  if (body.action === "deliver") {
    if (order.paymentStatus !== "paid") return NextResponse.json({ error: "Payment must be confirmed before delivery." }, { status: 400 });
    const values = Array.isArray(body.deliveredData) ? body.deliveredData.map((v: any) => String(v).trim()).filter(Boolean) : [];
    const itemIndex = Number(body.itemIndex);
    if (!order.items[itemIndex] || !values.length) return NextResponse.json({ error: "Choose an order item and enter delivery details." }, { status: 400 });
    order.items[itemIndex].deliveredData.push(...values);
    if (body.deliveryNote !== undefined) order.items[itemIndex].deliveryNote = String(body.deliveryNote).slice(0, 1000);
    const allDelivered = order.items.every((item: any) => item.deliveredData.length >= item.quantity);
    order.status = allDelivered ? "delivered" : "processing";
    if (allDelivered) order.deliveredAt = new Date();
    await order.save();
    if (allDelivered) await notify({ userId: order.userId, title: "Your order has been delivered", body: `Order ${order.orderNumber} is ready.`, type: "delivery", href: `/orders/${order._id}` });
    return NextResponse.json({ order });
  }
  if (body.action === "refund") {
    if (order.paymentStatus !== "paid") return NextResponse.json({ error: "Only paid orders can be refunded." }, { status: 400 });
    if (order.paymentMethod === "wallet") {
      const customer = await User.findByIdAndUpdate(order.userId, { $inc: { walletBalance: order.total } }, { new: true });
      if (customer) await WalletTransaction.create({ userId: customer._id, type: "refund", amount: order.total, balanceAfter: customer.walletBalance, reference: order.orderNumber, note: "Order refund" });
    }
    if (order.paymentMethod === "stripe") {
      if (!process.env.STRIPE_SECRET_KEY || !order.stripeSessionId) return NextResponse.json({ error: "Stripe refund details are unavailable." }, { status: 503 });
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId);
      const intent = session.payment_intent;
      if (!intent) return NextResponse.json({ error: "Stripe payment intent not found." }, { status: 400 });
      await stripe.refunds.create({ payment_intent: typeof intent === "string" ? intent : intent.id });
    }
    order.paymentStatus = "refunded"; order.status = "refunded";
    order.adminNote = String(body.note || "Refunded by administrator").slice(0, 1000);
    await order.save();
    await notify({ userId: order.userId, title: "Order refunded", body: `Order ${order.orderNumber} has been refunded.`, type: "payment", href: `/orders/${order._id}` });
    return NextResponse.json({ order });
  }
  if (body.adminNote !== undefined) order.adminNote = String(body.adminNote).slice(0, 1000);
  if (["processing", "completed", "cancelled"].includes(body.status)) order.status = body.status;
  await order.save();
  await notify({ userId: order.userId, title: "Order updated", body: `The status of ${order.orderNumber} is now ${order.status}.`, type: "order", href: `/orders/${order._id}` });
  return NextResponse.json({ order });
}

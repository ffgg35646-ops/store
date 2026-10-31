import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { dbConnect } from "@/lib/db";
import { Order, Product } from "@/lib/models";
import { fulfillOrder } from "@/lib/fulfillment";
import { notify } from "@/lib/store";

export async function POST(request: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 503 });
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  let event: Stripe.Event;
  try { event = stripe.webhooks.constructEvent(await request.text(), signature, process.env.STRIPE_WEBHOOK_SECRET); }
  catch { return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 }); }
  await dbConnect();
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    if (orderId) {
      const order = await Order.findOneAndUpdate({ _id: orderId, paymentStatus: "pending" }, { $set: { paymentStatus: "paid", status: "processing", paidAt: new Date() } }, { new: true });
      if (order) {
        await Product.updateMany({ _id: { $in: order.items.map((i: any) => i.productId) } }, { $inc: { salesCount: 1 } });
        await fulfillOrder(String(order._id));
        await notify({ userId: order.userId, title: "Payment confirmed", body: `Payment for ${order.orderNumber} was successful.`, type: "payment", href: `/orders/${order._id}` });
      }
    }
  } else if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.metadata?.orderId) await Order.updateOne({ _id: session.metadata.orderId, paymentStatus: "pending" }, { $set: { paymentStatus: "failed", status: "cancelled" } });
  }
  return NextResponse.json({ received: true });
}

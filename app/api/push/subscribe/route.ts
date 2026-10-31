import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { PushSubscription } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  await dbConnect();
  const subscription = await request.json();
  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth || !String(subscription.endpoint).startsWith("https://")) {
    return NextResponse.json({ error: "Invalid browser subscription." }, { status: 400 });
  }
  await PushSubscription.findOneAndUpdate(
    { endpoint: subscription.endpoint },
    { $set: { userId: user._id, endpoint: subscription.endpoint, subscription } },
    { upsert: true, new: true }
  );
  return NextResponse.json({ success: true }, { status: 201 });
}
export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  await dbConnect();
  const body = await request.json();
  if (body.endpoint) await PushSubscription.deleteOne({ userId: user._id, endpoint: body.endpoint });
  return NextResponse.json({ success: true });
}

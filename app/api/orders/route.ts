import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Order } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  await dbConnect();
  const filter = user.role === "admin" ? {} : { userId: user._id };
  const orders = await Order.find(filter).populate("userId", "name email").sort({ createdAt: -1 }).limit(200).lean();
  return NextResponse.json({ orders });
}

import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { User, Order } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (user?.role !== "admin") return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  await dbConnect();
  const users = await User.find({ role: "customer" }).select("name email status walletBalance points createdAt lastLoginAt").sort({ createdAt: -1 }).limit(500).lean();
  const counts = await Order.aggregate([{ $group: { _id: "$userId", count: { $sum: 1 }, spent: { $sum: "$total" } } }]);
  const lookup = new Map(counts.map((c: any) => [String(c._id), c]));
  return NextResponse.json({ users: users.map((u: any) => ({ ...u, orderCount: lookup.get(String(u._id))?.count || 0, lifetimeSpend: lookup.get(String(u._id))?.spent || 0 })) });
}

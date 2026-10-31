import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { User, Order } from "@/lib/models";
import bcrypt from "bcryptjs";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: Request) {
  const admin = await getCurrentUser();
  if (admin?.role !== "admin") return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  await dbConnect();
  const body = await request.json();
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  if (name.length < 2 || name.length > 80 || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email) || password.length < 8) return NextResponse.json({ error: "Enter a name, valid email and password of at least 8 characters." }, { status: 400 });
  if (await User.exists({ email })) return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  const customer = await User.create({ name, email, password: await bcrypt.hash(password, 12), role: "customer" });
  return NextResponse.json({ success: true, user: { _id: customer._id, name: customer.name, email: customer.email }, message: "Customer account created." }, { status: 201 });
}

export async function GET() {
  const user = await getCurrentUser();
  if (user?.role !== "admin") return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  await dbConnect();
  const users = await User.find({ role: "customer" }).select("name email status walletBalance points discountPercent createdAt lastLoginAt").sort({ createdAt: -1 }).limit(500).lean();
  const counts = await Order.aggregate([{ $group: { _id: "$userId", count: { $sum: 1 }, spent: { $sum: "$total" } } }]);
  const lookup = new Map(counts.map((c: any) => [String(c._id), c]));
  return NextResponse.json({ users: users.map((u: any) => ({ ...u, orderCount: lookup.get(String(u._id))?.count || 0, lifetimeSpend: lookup.get(String(u._id))?.spent || 0 })) });
}

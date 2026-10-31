import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { User, WalletTransaction } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth";
import { notify } from "@/lib/store";

export async function POST(request: NextRequest) {
  const admin = await getCurrentUser();
  if (admin?.role !== "admin") return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  await dbConnect();
  const body = await request.json();
  const amount = Number(body.amount || 0);
  const points = Math.max(0, Math.floor(Number(body.points || 0)));
  if ((!amount || amount <= 0) && !points) return NextResponse.json({ error: "Enter a positive wallet amount or points." }, { status: 400 });
  let users: any[];
  if (body.targetType === "selected") {
    if (!Array.isArray(body.userIds) || !body.userIds.length) return NextResponse.json({ error: "Select at least one customer." }, { status: 400 });
    users = await User.find({ _id: { $in: body.userIds }, role: "customer", status: "active" });
  } else users = await User.find({ role: "customer", status: "active" });
  for (const customer of users) {
    if (amount > 0) {
      customer.walletBalance += amount;
      await WalletTransaction.create({ userId: customer._id, type: "reward", amount, balanceAfter: customer.walletBalance, note: String(body.note || "Store reward"), createdBy: admin._id });
    }
    if (points > 0) customer.points += points;
    await customer.save();
  }
  if (users.length) await notify({ targetUserIds: users.map((u: any) => u._id), title: String(body.title || "You received a reward"), body: String(body.message || "A reward has been added to your account."), type: "reward", href: "/account" });
  return NextResponse.json({ success: true, recipients: users.length }, { status: 201 });
}

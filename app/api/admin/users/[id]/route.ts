import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { User, WalletTransaction } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth";
import { notify } from "@/lib/store";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentUser();
  if (admin?.role !== "admin") return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  await dbConnect();
  const { id } = await context.params;
  const body = await request.json();
  const user = await User.findById(id);
  if (!user || user.role === "admin") return NextResponse.json({ error: "Customer not found." }, { status: 404 });
  if (body.status && ["active", "suspended"].includes(body.status)) user.status = body.status;
  if (body.name) user.name = String(body.name).slice(0, 80);
  if (body.walletAdjustment !== undefined) {
    const amount = Number(body.walletAdjustment);
    if (!Number.isFinite(amount) || amount === 0) return NextResponse.json({ error: "Enter a non-zero wallet adjustment." }, { status: 400 });
    if (user.walletBalance + amount < 0) return NextResponse.json({ error: "Wallet balance cannot become negative." }, { status: 400 });
    user.walletBalance += amount;
    await WalletTransaction.create({ userId: user._id, type: amount > 0 ? "credit" : "adjustment", amount, balanceAfter: user.walletBalance, note: String(body.note || "Administrator wallet adjustment"), createdBy: admin._id });
  }
  if (body.points !== undefined) user.points = Math.max(0, Number(body.points) || 0);
  await user.save();
  if (body.status === "suspended") await notify({ userId: user._id, title: "Account suspended", body: "Your account access has been temporarily suspended. Contact support for help.", type: "system" });
  return NextResponse.json({ user: { _id: user._id, name: user.name, email: user.email, status: user.status, walletBalance: user.walletBalance, points: user.points } });
}
export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentUser();
  if (admin?.role !== "admin") return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  await dbConnect();
  const { id } = await context.params;
  const user = await User.findOneAndUpdate({ _id: id, role: "customer" }, { $set: { status: "deleted", email: `deleted+${id}@invalid.local`, name: "Deleted customer" } }, { new: true });
  if (!user) return NextResponse.json({ error: "Customer not found." }, { status: 404 });
  return NextResponse.json({ success: true, message: "Account deactivated and identifiers anonymized; order records remain intact." });
}

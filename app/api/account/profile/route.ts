import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/db";
import { User } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(request: NextRequest) {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  await dbConnect();
  const body = await request.json();
  const user = await User.findOne({ _id: current._id, status: "active" }).select("+password");
  if (!user) return NextResponse.json({ error: "Account not found." }, { status: 404 });
  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (name.length < 2 || name.length > 80) return NextResponse.json({ error: "Name must be between 2 and 80 characters." }, { status: 400 });
    user.name = name;
  }
  if (body.newPassword !== undefined && String(body.newPassword)) {
    if (String(body.newPassword).length < 8) return NextResponse.json({ error: "New password must be at least 8 characters." }, { status: 400 });
    if (!await bcrypt.compare(String(body.currentPassword || ""), user.password)) return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
    user.password = await bcrypt.hash(String(body.newPassword), 12);
  }
  await user.save();
  return NextResponse.json({ success: true, user: { _id: user._id, name: user.name, email: user.email, role: user.role, walletBalance: user.walletBalance, points: user.points, discountPercent: user.discountPercent } });
}

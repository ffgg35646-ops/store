import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/db";
import { User } from "@/lib/models";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = String(body.token || "");
    const password = String(body.password || "");
    if (token.length !== 64 || password.length < 8 || password.length > 200) return NextResponse.json({ error: "Use a valid reset link and a password of at least 8 characters." }, { status: 400 });
    await dbConnect();
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({ passwordResetTokenHash: tokenHash, passwordResetExpiresAt: { $gt: new Date() }, status: "active" }).select("+passwordResetTokenHash +passwordResetExpiresAt");
    if (!user) return NextResponse.json({ error: "This reset link is invalid or has expired. Request a new one." }, { status: 400 });
    user.password = await bcrypt.hash(password, 12);
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpiresAt = undefined;
    await user.save();
    return NextResponse.json({ success: true, message: "Password updated. You can now sign in." });
  } catch (error) {
    console.error("reset-password", error);
    return NextResponse.json({ error: "Unable to reset your password right now." }, { status: 500 });
  }
}

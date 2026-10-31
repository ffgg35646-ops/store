import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { dbConnect } from "@/lib/db";
import { User } from "@/lib/models";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const token = String(body.token || "");
    if (!/^[a-f0-9]{64}$/.test(token)) return NextResponse.json({ error: "This verification link is invalid or expired." }, { status: 400 });
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({ emailVerificationTokenHash: tokenHash, emailVerificationExpiresAt: { $gt: new Date() }, emailVerified: false }).select("+emailVerificationTokenHash +emailVerificationExpiresAt");
    if (!user) return NextResponse.json({ error: "This verification link is invalid or expired. Request a new email if needed." }, { status: 400 });
    user.emailVerified = true;
    user.emailVerificationTokenHash = undefined;
    user.emailVerificationExpiresAt = undefined;
    await user.save();
    return NextResponse.json({ success: true, message: "Email verified. You can now sign in." });
  } catch (error) {
    console.error("verify-email", error);
    return NextResponse.json({ error: "Unable to verify this email right now." }, { status: 500 });
  }
}

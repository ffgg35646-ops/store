import { NextRequest, NextResponse } from "next/server";
import { randomBytes, createHash } from "node:crypto";
import nodemailer from "nodemailer";
import { dbConnect } from "@/lib/db";
import { User } from "@/lib/models";
import { buildVerificationEmail } from "@/lib/verification-email";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    const user = await User.findOne({ email, status: "active", emailVerified: false });
    if (!user) return NextResponse.json({ success: true, message: "If your account needs verification, an email will be sent." });
    if (!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD && process.env.SMTP_FROM)) return NextResponse.json({ error: "Email delivery is not configured. Please contact support." }, { status: 503 });
    const token = randomBytes(32).toString("hex");
    user.emailVerificationTokenHash = createHash("sha256").update(token).digest("hex");
    user.emailVerificationExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();
    const base = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
    const verifyUrl = `${base}/verify-email?token=${token}`;
    const transport = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: String(process.env.SMTP_SECURE || "false") === "true", auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } });
    try {
      await transport.sendMail({
        from: process.env.SMTP_FROM,
        to: user.email,
        ...buildVerificationEmail(user.name, verifyUrl),
      });
    } finally {
      transport.close();
    }
    return NextResponse.json({ success: true, message: "Verification email sent." });
  } catch (error) {
    console.error("resend-verification", error);
    return NextResponse.json({ error: "Unable to resend verification email." }, { status: 500 });
  }
}

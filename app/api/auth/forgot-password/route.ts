import { NextRequest, NextResponse } from "next/server";
import { randomBytes, createHash } from "node:crypto";
import nodemailer from "nodemailer";
import { dbConnect } from "@/lib/db";
import { User } from "@/lib/models";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      const user = await User.findOne({ email, status: "active" });
      if (user) {
        const token = randomBytes(32).toString("hex");
        user.passwordResetTokenHash = createHash("sha256").update(token).digest("hex");
        user.passwordResetExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
        await user.save();
        const base = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
        const resetUrl = `${base}/reset-password?token=${token}`;
        if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD && process.env.SMTP_FROM) {
          const transport = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 587),
            secure: String(process.env.SMTP_SECURE || "false") === "true",
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
          });
          await transport.sendMail({
            from: process.env.SMTP_FROM, to: user.email,
            subject: "Reset your Nova Digital password",
            text: `A password reset was requested for your account. This link expires in 30 minutes: ${resetUrl}\n\nIf you did not request this, ignore this email.`,
            html: `<p>A password reset was requested for your account.</p><p><a href="${resetUrl}">Reset password</a></p><p>This link expires in 30 minutes. If you did not request this, ignore this email.</p>`
          });
        } else if (process.env.NODE_ENV !== "production") {
          console.info("Development password reset URL:", resetUrl);
        }
      }
    }
    return NextResponse.json({ success: true, message: "If an active account exists for that email, password reset instructions will be sent." });
  } catch (error) {
    console.error("forgot-password", error);
    return NextResponse.json({ error: "Unable to process this request right now." }, { status: 500 });
  }
}

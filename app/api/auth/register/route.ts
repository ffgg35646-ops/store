import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomBytes, createHash } from "node:crypto";
import nodemailer from "nodemailer";
import { dbConnect } from "@/lib/db";
import { User } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth";
import { notify } from "@/lib/store";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    if (await getCurrentUser()) return NextResponse.json({ error: "Sign out of your current account before creating another account." }, { status: 409 });
    const body = await request.json();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const confirmPassword = String(body.confirmPassword || "");
    if (name.length < 2 || name.length > 80) return NextResponse.json({ error: "Enter a valid name." }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
    if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    if (password !== confirmPassword) return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
    if (!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD && process.env.SMTP_FROM) && process.env.NODE_ENV === "production") return NextResponse.json({ error: "Email verification is not configured yet. Please contact support." }, { status: 503 });
    if (await User.exists({ email })) return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    const verificationToken = randomBytes(32).toString("hex");
    const user = await User.create({ name, email, password: await bcrypt.hash(password, 12), emailVerified: false, emailVerificationTokenHash: createHash("sha256").update(verificationToken).digest("hex"), emailVerificationExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) });
    await notify({ userId: user._id, title: "Welcome to the store", body: "Your account is ready. Explore the catalog and discover digital essentials.", type: "system", href: "/account" });
    const base = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
    const requestedNext = String(body.next || "").trim();
    const safeNext = requestedNext.startsWith("/") && !requestedNext.startsWith("//") && !requestedNext.startsWith("/admin") ? requestedNext : "";
    const verifyUrl = `${base}/verify-email?token=${verificationToken}${safeNext ? `&next=${encodeURIComponent(safeNext)}` : ""}`;
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD && process.env.SMTP_FROM) {
      const transport = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: String(process.env.SMTP_SECURE || "false") === "true", auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } });
      try {
        await transport.sendMail({ from: process.env.SMTP_FROM, to: user.email, subject: "Verify your Nova Digital email", text: `Welcome to Nova Digital. Verify your email within 24 hours: ${verifyUrl}`, html: `<p>Welcome to Nova Digital, ${name.replace(/[<>]/g, "")}.</p><p>Verify your email address to activate your account.</p><p><a href="${verifyUrl}">Verify my email</a></p><p>This link expires in 24 hours.</p>` });
      } catch (mailError) { await User.deleteOne({ _id: user._id }); throw mailError; }
    } else if (process.env.NODE_ENV !== "production") {
      console.info("Development email verification URL:", verifyUrl);
    }
    return NextResponse.json({ verificationRequired: true, email: user.email, message: "Check your email to verify and activate your account." }, { status: 201 });
  } catch (error) {
    console.error("register", error);
    return NextResponse.json({ error: "Unable to create your account." }, { status: 500 });
  }
}

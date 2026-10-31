import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/db";
import { User } from "@/lib/models";
import { createSession, sessionCookieName } from "@/lib/auth";
import { safeUser } from "@/lib/store";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const { email, password } = await request.json();
    const user = await User.findOne({ email: String(email || "").trim().toLowerCase() }).select("+password");
    if (!user || user.status !== "active" || !(await bcrypt.compare(String(password || ""), user.password))) return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
    if (!user.emailVerified) return NextResponse.json({ error: "Please verify your email before signing in. Check your inbox for the verification link." }, { status: 403 });
    user.lastLoginAt = new Date();
    await user.save();
    const token = await createSession(user);
    const response = NextResponse.json({ user: safeUser(user) });
    response.cookies.set(sessionCookieName, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 604800 });
    return response;
  } catch (error) {
    console.error("login", error);
    return NextResponse.json({ error: "Unable to sign in." }, { status: 500 });
  }
}

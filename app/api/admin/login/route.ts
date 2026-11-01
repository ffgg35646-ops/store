import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/db";
import { User } from "@/lib/models";
import { createSession, getCurrentUser, sessionCookieName } from "@/lib/auth";
import { safeUser } from "@/lib/store";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    if (await getCurrentUser()) return NextResponse.json({ error: "Sign out of your current account before switching to administrator access." }, { status: 409 });
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    if (!email || !password) return NextResponse.json({ error: "Enter your administrator email and password." }, { status: 400 });

    const user = await User.findOne({ email }).select("+password");
    if (!user || user.role !== "admin" || user.status !== "active" || !(await bcrypt.compare(password, user.password))) {
      return NextResponse.json({ error: "Administrator email or password is incorrect." }, { status: 401 });
    }
    if (!user.emailVerified) return NextResponse.json({ error: "Verify the administrator email before signing in." }, { status: 403 });

    user.lastLoginAt = new Date();
    await user.save();
    const token = await createSession(user);
    const response = NextResponse.json({ user: safeUser(user) });
    response.cookies.set(sessionCookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 604800
    });
    return response;
  } catch (error) {
    console.error("admin login", error);
    return NextResponse.json({ error: "Unable to sign in to the admin dashboard." }, { status: 500 });
  }
}

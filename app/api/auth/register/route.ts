import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/db";
import { User } from "@/lib/models";
import { createSession, sessionCookieName } from "@/lib/auth";
import { notify, safeUser } from "@/lib/store";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    if (name.length < 2 || name.length > 80) return NextResponse.json({ error: "Enter a valid name." }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
    if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    if (await User.exists({ email })) return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    const user = await User.create({ name, email, password: await bcrypt.hash(password, 12) });
    const token = await createSession(user);
    await notify({ userId: user._id, title: "Welcome to the store", body: "Your account is ready. Explore the catalog and discover digital essentials.", type: "system", href: "/account" });
    const response = NextResponse.json({ user: safeUser(user) }, { status: 201 });
    response.cookies.set(sessionCookieName, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 604800 });
    return response;
  } catch (error) {
    console.error("register", error);
    return NextResponse.json({ error: "Unable to create your account." }, { status: 500 });
  }
}

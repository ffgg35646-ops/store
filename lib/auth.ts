import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { User } from "@/lib/models";
import { dbConnect } from "@/lib/db";

const COOKIE_NAME = "store_session";

function secret() {
  const value = process.env.JWT_SECRET;
  if (!value || value.length < 32) throw new Error("JWT_SECRET must be at least 32 characters.");
  return new TextEncoder().encode(value);
}

export async function createSession(user: { _id: unknown; role: string }) {
  return new SignJWT({ role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user._id))
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}

export async function getCurrentUser() {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    await dbConnect();
    const user = await User.findById(payload.sub).select("name email role status walletBalance points").lean();
    if (!user || user.status !== "active") return null;
    return { ...user, _id: String(user._id) };
  } catch {
    return null;
  }
}

export const sessionCookieName = COOKIE_NAME;

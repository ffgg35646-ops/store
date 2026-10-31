import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("store_session")?.value;
  if (!token) return NextResponse.redirect(new URL("/login?next=/admin", request.url));
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 32) throw new Error("Missing secret");
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    if (payload.role !== "admin") return NextResponse.redirect(new URL("/", request.url));
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login?next=/admin", request.url));
  }
}

export const config = { matcher: ["/admin/:path*"] };

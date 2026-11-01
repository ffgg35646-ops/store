import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/admin/login") return NextResponse.next();
  const token = request.cookies.get("store_session")?.value;
  const loginUrl = new URL("/admin-login", request.url);
  const nextPath = request.nextUrl.pathname + request.nextUrl.search;
  if (request.nextUrl.pathname !== "/admin/login") loginUrl.searchParams.set("next", nextPath);

  if (!token) return NextResponse.redirect(loginUrl);
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 32) throw new Error("Missing secret");
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    if (payload.role !== "admin") return NextResponse.redirect(loginUrl);
    if (request.nextUrl.pathname === "/admin/login") return NextResponse.redirect(new URL("/admin", request.url));
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(loginUrl);
  }
}

export const config = { matcher: ["/admin/:path*"] };

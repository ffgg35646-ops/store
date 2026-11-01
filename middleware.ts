import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

function isPath(pathname: string, base: string) {
  return pathname === base || pathname.startsWith(`${base}/`);
}
function isCustomerArea(pathname: string) {
  return ["/account", "/cart", "/checkout", "/orders", "/chat"].some((base) => isPath(pathname, base));
}
function isCustomerAuthPage(pathname: string) {
  return ["/login", "/register", "/forgot-password", "/verify-email"].some((base) => isPath(pathname, base));
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const token = request.cookies.get("store_session")?.value;
  let role: "admin" | "customer" | null = null;
  if (token) {
    try {
      const secret = process.env.JWT_SECRET;
      if (!secret || secret.length < 32) throw new Error("Missing secret");
      const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
      if (payload.role === "admin" || payload.role === "customer") role = payload.role;
    } catch {
      role = null;
    }
  }

  if (isPath(pathname, "/admin")) {
    if (role === "admin") return NextResponse.next();
    if (role === "customer") return NextResponse.redirect(new URL("/", request.url));
    const loginUrl = new URL("/admin-login", request.url);
    loginUrl.searchParams.set("next", pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }
  if (pathname === "/admin-login") {
    if (role === "admin") return NextResponse.redirect(new URL("/admin", request.url));
    if (role === "customer") return NextResponse.redirect(new URL("/", request.url));
    return NextResponse.next();
  }
  if (isCustomerArea(pathname)) {
    if (role === "admin") return NextResponse.redirect(new URL("/admin", request.url));
    if (role !== "customer") {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname + request.nextUrl.search);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }
  if (isCustomerAuthPage(pathname)) {
    if (role === "admin") return NextResponse.redirect(new URL("/admin", request.url));
    if (role === "customer") return NextResponse.redirect(new URL("/account", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/admin-login",
    "/account/:path*",
    "/cart",
    "/checkout",
    "/orders/:path*",
    "/chat/:path*",
    "/login",
    "/register",
    "/forgot-password",
    "/verify-email"
  ]
};

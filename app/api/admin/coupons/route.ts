import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Coupon } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (user?.role !== "admin") return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  await dbConnect();
  return NextResponse.json({ coupons: await Coupon.find().sort({ createdAt: -1 }).lean() });
}
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (user?.role !== "admin") return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  await dbConnect();
  const body = await request.json();
  const code = String(body.code || "").trim().toUpperCase().replace(/\s+/g, "");
  const value = Number(body.value);
  if (!/^[A-Z0-9_-]{3,30}$/.test(code) || !Number.isFinite(value) || value <= 0) return NextResponse.json({ error: "Enter a valid coupon code and discount." }, { status: 400 });
  const coupon = await Coupon.create({
    code, description: body.description || "", discountType: body.discountType === "fixed" ? "fixed" : "percentage", value,
    minOrder: Number(body.minOrder || 0), maxDiscount: Number(body.maxDiscount || 0),
    startsAt: body.startsAt ? new Date(body.startsAt) : undefined, endsAt: body.endsAt ? new Date(body.endsAt) : undefined,
    usageLimit: Number(body.usageLimit || 0), targetType: ["users", "products", "categories"].includes(body.targetType) ? body.targetType : "all",
    targetIds: Array.isArray(body.targetIds) ? body.targetIds : [], active: body.active !== false
  });
  return NextResponse.json({ coupon }, { status: 201 });
}

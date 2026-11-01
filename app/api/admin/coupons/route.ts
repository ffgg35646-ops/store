import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Coupon } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth";

function cleanIds(value: unknown) {
  return Array.isArray(value) ? value.map((id) => String(id).trim()).filter(Boolean) : [];
}

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
  const autoApply = body.autoApply === true;
  let code = String(body.code || "").trim().toUpperCase().replace(/\s+/g, "");
  if (!code && autoApply) code = `AUTO-${Date.now().toString(36).toUpperCase()}`;
  const value = Number(body.value);
  const discountType = body.discountType === "fixed" ? "fixed" : "percentage";
  const targetUserIds = cleanIds(body.targetUserIds);
  const targetProductIds = cleanIds(body.targetProductIds);
  const targetCategoryIds = cleanIds(body.targetCategoryIds);
  const targetAllProducts = body.targetAllProducts !== false;

  if (!/^[A-Z0-9_-]{3,40}$/.test(code) || !Number.isFinite(value) || value <= 0 || (discountType === "percentage" && value > 100)) {
    return NextResponse.json({ error: "Enter a valid code (or enable automatic application) and discount value." }, { status: 400 });
  }
  if (!targetAllProducts && targetProductIds.length === 0 && targetCategoryIds.length === 0) {
    return NextResponse.json({ error: "Choose at least one product or category, or enable all products." }, { status: 400 });
  }
  if (body.startsAt && Number.isNaN(new Date(body.startsAt).getTime())) return NextResponse.json({ error: "Invalid start date." }, { status: 400 });
  if (body.endsAt && Number.isNaN(new Date(body.endsAt).getTime())) return NextResponse.json({ error: "Invalid end date." }, { status: 400 });
  if (body.startsAt && body.endsAt && new Date(body.endsAt) < new Date(body.startsAt)) return NextResponse.json({ error: "The end date must be after the start date." }, { status: 400 });

  try {
    const coupon = await Coupon.create({
      code,
      description: String(body.description || "").slice(0, 300),
      discountType,
      value,
      minOrder: Math.max(0, Number(body.minOrder || 0)),
      maxDiscount: Math.max(0, Number(body.maxDiscount || 0)),
      startsAt: body.startsAt ? new Date(body.startsAt) : undefined,
      endsAt: body.endsAt ? new Date(body.endsAt) : undefined,
      usageLimit: Math.max(0, Number(body.usageLimit || 0)),
      targetType: "all",
      targetIds: [],
      targetAllProducts,
      targetUserIds,
      targetProductIds,
      targetCategoryIds,
      autoApply,
      active: body.active !== false
    });
    return NextResponse.json({ coupon }, { status: 201 });
  } catch (error: any) {
    if (error?.code === 11000) return NextResponse.json({ error: "This discount code already exists." }, { status: 409 });
    console.error("create coupon", error);
    return NextResponse.json({ error: "Unable to create this discount." }, { status: 500 });
  }
}

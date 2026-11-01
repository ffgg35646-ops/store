import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Coupon } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth";

function cleanIds(value: unknown) {
  return Array.isArray(value) ? value.map((id) => String(id).trim()).filter(Boolean) : [];
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (user?.role !== "admin") return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  await dbConnect();
  const { id } = await context.params;
  const body = await request.json();
  const existing: any = await Coupon.findById(id).lean();
  if (!existing) return NextResponse.json({ error: "Discount not found." }, { status: 404 });
  const update: any = {};

  const nextType = body.discountType ?? existing.discountType ?? "percentage";
  if (body.discountType !== undefined) update.discountType = body.discountType === "fixed" ? "fixed" : "percentage";
  if (body.value !== undefined) {
    const value = Number(body.value);
    if (!Number.isFinite(value) || value <= 0 || (nextType !== "fixed" && value > 100)) {
      return NextResponse.json({ error: "Enter a valid discount value. Percentage discounts must be 100 or less." }, { status: 400 });
    }
    update.value = value;
  }
  if (body.code !== undefined) {
    const code = String(body.code || "").trim().toUpperCase().replace(/\s+/g, "");
    if (code) {
      if (!/^[A-Z0-9_-]{3,40}$/.test(code)) return NextResponse.json({ error: "Discount codes must be 3–40 letters or numbers." }, { status: 400 });
      update.code = code;
    }
  }
  for (const key of ["description", "minOrder", "maxDiscount", "usageLimit", "active", "autoApply", "targetAllProducts"]) {
    if (body[key] !== undefined) update[key] = body[key];
  }
  if (body.startsAt !== undefined) update.startsAt = body.startsAt ? new Date(body.startsAt) : undefined;
  if (body.endsAt !== undefined) update.endsAt = body.endsAt ? new Date(body.endsAt) : undefined;
  if (body.targetUserIds !== undefined) update.targetUserIds = cleanIds(body.targetUserIds);
  if (body.targetProductIds !== undefined) update.targetProductIds = cleanIds(body.targetProductIds);
  if (body.targetCategoryIds !== undefined) update.targetCategoryIds = cleanIds(body.targetCategoryIds);
  if (body.targetType !== undefined) update.targetType = body.targetType;
  if (body.targetIds !== undefined) update.targetIds = cleanIds(body.targetIds);

  const targetAllProducts = update.targetAllProducts ?? (existing.targetAllProducts !== false);
  const productTargets = update.targetProductIds ?? existing.targetProductIds ?? [];
  const categoryTargets = update.targetCategoryIds ?? existing.targetCategoryIds ?? [];
  const legacyTargets = existing.targetType === "products" || existing.targetType === "categories" ? (update.targetIds ?? existing.targetIds ?? []) : [];
  if (!targetAllProducts && !productTargets.length && !categoryTargets.length && !legacyTargets.length) {
    return NextResponse.json({ error: "Choose at least one product or category, or enable all products." }, { status: 400 });
  }
  if (body.startsAt && body.endsAt && new Date(body.endsAt) < new Date(body.startsAt)) {
    return NextResponse.json({ error: "The end date must be after the start date." }, { status: 400 });
  }

  try {
    const coupon = await Coupon.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    if (!coupon) return NextResponse.json({ error: "Discount not found." }, { status: 404 });
    return NextResponse.json({ coupon });
  } catch (error: any) {
    if (error?.code === 11000) return NextResponse.json({ error: "This discount code already exists." }, { status: 409 });
    console.error("update coupon", error);
    return NextResponse.json({ error: "Unable to update this discount." }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (user?.role !== "admin") return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  await dbConnect();
  const { id } = await context.params;
  await Coupon.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}

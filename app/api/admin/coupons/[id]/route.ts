import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Coupon } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (user?.role !== "admin") return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  await dbConnect();
  const { id } = await context.params;
  const body = await request.json();
  const update: any = {};
  for (const key of ["code", "description", "discountType", "value", "minOrder", "maxDiscount", "startsAt", "endsAt", "usageLimit", "targetType", "targetIds", "active"]) if (body[key] !== undefined) update[key] = body[key];
  const coupon = await Coupon.findByIdAndUpdate(id, update, { new: true, runValidators: true });
  if (!coupon) return NextResponse.json({ error: "Coupon not found." }, { status: 404 });
  return NextResponse.json({ coupon });
}
export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (user?.role !== "admin") return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  await dbConnect();
  const { id } = await context.params;
  await Coupon.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}

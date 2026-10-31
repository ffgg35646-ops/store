import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Category, Product } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth";
import { slugify } from "@/lib/store";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (user?.role !== "admin") return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  await dbConnect();
  const { id } = await context.params;
  const body = await request.json();
  const update: any = {};
  for (const key of ["name", "description", "image", "sortOrder", "isActive"]) if (body[key] !== undefined) update[key] = body[key];
  if (body.name) update.slug = slugify(body.slug || body.name);
  const category = await Category.findByIdAndUpdate(id, update, { new: true, runValidators: true });
  if (!category) return NextResponse.json({ error: "Category not found." }, { status: 404 });
  return NextResponse.json({ category });
}
export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (user?.role !== "admin") return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  await dbConnect();
  const { id } = await context.params;
  if (await Product.exists({ categoryId: id })) return NextResponse.json({ error: "Move or delete this category's products first." }, { status: 409 });
  await Category.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}

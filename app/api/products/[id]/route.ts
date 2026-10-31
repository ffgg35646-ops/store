import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { InventoryItem, Product } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth";
import { slugify } from "@/lib/store";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  await dbConnect();
  const { id } = await context.params;
  const product = await Product.findById(id).populate("categoryId", "name slug").lean();
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });
  return NextResponse.json({ product });
}
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (user?.role !== "admin") return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  await dbConnect();
  const { id } = await context.params;
  const body = await request.json();
  const update: any = {};
  for (const key of ["title", "shortDescription", "description", "image", "gallery", "categoryId", "price", "compareAtPrice", "currency", "deliveryMode", "deliveryInstructions", "isFeatured", "isActive", "sortOrder"]) if (body[key] !== undefined) update[key] = body[key];
  if (body.title) update.slug = slugify(body.slug || body.title);
  const product = await Product.findByIdAndUpdate(id, update, { new: true, runValidators: true });
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });
  return NextResponse.json({ product });
}
export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (user?.role !== "admin") return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  await dbConnect();
  const { id } = await context.params;
  await Product.findByIdAndUpdate(id, { isActive: false });
  await InventoryItem.updateMany({ productId: id, status: "available" }, { $set: { status: "issued" } });
  return NextResponse.json({ success: true, message: "Product hidden; order history is preserved." });
}

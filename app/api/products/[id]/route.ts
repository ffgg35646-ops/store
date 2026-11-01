import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Coupon, InventoryItem, Order, Product } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth";
import { slugify } from "@/lib/store";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  await dbConnect();
  const { id } = await context.params;
  const user = await getCurrentUser();
  const product = await Product.findById(id).populate("categoryId", "name slug").lean();
  if (!product || (!(user?.role === "admin") && !product.isActive)) return NextResponse.json({ error: "Product not found." }, { status: 404 });
  const personalDiscountPercent = user?.role === "customer" ? Math.min(100, Math.max(0, Number(user.discountPercent || 0))) : 0;
  const basePrice = Number((product as any).price);
  return NextResponse.json({ product: { ...product, basePrice, personalDiscountPercent, price: personalDiscountPercent ? Math.round(basePrice * (1 - personalDiscountPercent / 100) * 100) / 100 : basePrice } });
}
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (user?.role !== "admin") return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  await dbConnect();
  const { id } = await context.params;
  const body = await request.json();
  const update: any = {};
  for (const key of ["title", "shortDescription", "description", "image", "gallery", "colors", "categoryId", "price", "compareAtPrice", "currency", "deliveryMode", "deliveryInstructions", "isFeatured", "isActive", "sortOrder"]) if (body[key] !== undefined) update[key] = body[key];
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
  const product = await Product.findById(id);
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  const [usedInOrders, hasInventory] = await Promise.all([
    Order.exists({ "items.productId": id }),
    InventoryItem.exists({ productId: id })
  ]);

  if (!usedInOrders && !hasInventory) {
    await Product.deleteOne({ _id: id });
    await Coupon.updateMany({ targetProductIds: id }, { $pull: { targetProductIds: id } });
    await Coupon.updateMany({ targetType: "products", targetIds: id }, { $pull: { targetIds: id } });
    return NextResponse.json({ success: true, deleted: true, message: "Product permanently deleted." });
  }

  product.isActive = false;
  await product.save();
  return NextResponse.json({
    success: true,
    archived: true,
    message: "Product removed from the storefront. It is preserved because it has order history or inventory."
  });
}

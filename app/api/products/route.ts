import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Category, InventoryItem, Product, Settings } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth";
import { slugify } from "@/lib/store";

function escapeRegex(value: string) { const special = new Set([".", "*", "+", "?", "^", "$", "{", "}", "(", ")", "|", "[", "]", String.fromCharCode(92)]); return [...value].map((ch) => special.has(ch) ? String.fromCharCode(92) + ch : ch).join(""); }

export async function GET(request: NextRequest) {
  await dbConnect();
  const user = await getCurrentUser();
  const params = request.nextUrl.searchParams;
  const query = String(params.get("q") || "").trim();
  const filter: any = {};
  if (!(user?.role === "admin" && params.get("includeInactive") === "1")) filter.isActive = true;
  if (params.get("category")) filter.categoryId = params.get("category");
  if (params.get("featured") === "1") filter.isFeatured = true;
  if (params.get("slug")) filter.slug = params.get("slug");
  if (query) filter.$or = [{ title: new RegExp(escapeRegex(query), "i") }, { shortDescription: new RegExp(escapeRegex(query), "i") }];
  const products = await Product.find(filter).populate("categoryId", "name slug").sort({ sortOrder: 1, createdAt: -1 }).limit(100).lean();
  const personalDiscount = user?.role === "customer" ? Math.min(100, Math.max(0, Number(user.discountPercent || 0))) : 0;
  const ids = products.map((p: any) => p._id);
  const stockRows = await InventoryItem.aggregate([{ $match: { productId: { $in: ids }, status: "available" } }, { $group: { _id: "$productId", count: { $sum: 1 } } }]);
  const stockMap = new Map(stockRows.map((r: any) => [String(r._id), r.count]));
  return NextResponse.json({ products: products.map((p: any) => ({ ...p, basePrice: p.price, personalDiscountPercent: personalDiscount, price: personalDiscount ? Math.round(Number(p.price) * (1 - personalDiscount / 100) * 100) / 100 : p.price, availableStock: stockMap.get(String(p._id)) || 0 })) });
}
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (user?.role !== "admin") return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  await dbConnect();
  const body = await request.json();
  const title = String(body.title || "").trim();
  if (!title || !body.categoryId || !Number.isFinite(Number(body.price)) || Number(body.price) < 0) return NextResponse.json({ error: "Title, category and a valid price are required." }, { status: 400 });
  if (!(await Category.exists({ _id: body.categoryId }))) return NextResponse.json({ error: "Choose an existing category." }, { status: 400 });
  const base = slugify(body.slug || title);
  let slug = base, suffix = 1;
  while (await Product.exists({ slug })) slug = `${base}-${suffix++}`;
  const settings = await Settings.findOne({ key: "store" }).lean();
  const product = await Product.create({
    title, slug, shortDescription: body.shortDescription || "", description: body.description || "", image: body.image || "",
    gallery: Array.isArray(body.gallery) ? body.gallery : [], categoryId: body.categoryId,
    price: Number(body.price), compareAtPrice: Number(body.compareAtPrice || 0), currency: body.currency || (settings as any)?.currency || process.env.NEXT_PUBLIC_STORE_CURRENCY || "USD",
    deliveryMode: body.deliveryMode === "manual" ? "manual" : "automatic", deliveryInstructions: body.deliveryInstructions || "",
    isFeatured: Boolean(body.isFeatured), isActive: body.isActive !== false, sortOrder: Number(body.sortOrder || 0)
  });
  return NextResponse.json({ product }, { status: 201 });
}

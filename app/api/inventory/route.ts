import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { InventoryItem, Product } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (user?.role !== "admin") return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  await dbConnect();
  const productId = request.nextUrl.searchParams.get("productId");
  const match: any = {};
  if (productId) match.productId = productId;
  const items = await InventoryItem.find(match).populate("productId", "title").sort({ createdAt: -1 }).limit(300).lean();
  return NextResponse.json({ items });
}
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (user?.role !== "admin") return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  await dbConnect();
  const body = await request.json();
  const productId = String(body.productId || "");
  const values = String(body.values || "").split(/\r?\n/).map((v) => v.trim()).filter(Boolean);
  if (!(await Product.exists({ _id: productId })) || !values.length) return NextResponse.json({ error: "Choose a product and enter at least one stock code." }, { status: 400 });
  if (values.length > 2000) return NextResponse.json({ error: "Add up to 2,000 stock items per batch." }, { status: 400 });
  await InventoryItem.insertMany(values.map((value) => ({ productId, value })));
  return NextResponse.json({ success: true, added: values.length }, { status: 201 });
}

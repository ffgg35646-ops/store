import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Category } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth";
import { slugify } from "@/lib/store";

export async function GET(request: NextRequest) {
  await dbConnect();
  const user = await getCurrentUser();
  const includeInactive = request.nextUrl.searchParams.get("includeInactive") === "1" && user?.role === "admin";
  const categories = await Category.find(includeInactive ? {} : { isActive: true }).sort({ sortOrder: 1, name: 1 }).lean();
  return NextResponse.json({ categories });
}
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (user?.role !== "admin") return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  await dbConnect();
  const body = await request.json();
  const name = String(body.name || "").trim();
  if (!name) return NextResponse.json({ error: "Category name is required." }, { status: 400 });
  const base = slugify(body.slug || name);
  let slug = base, suffix = 1;
  while (await Category.exists({ slug })) slug = `${base}-${suffix++}`;
  const category = await Category.create({ name, slug, description: body.description || "", image: body.image || "", icon: String(body.icon || "boxes"), sortOrder: Number(body.sortOrder || 0), isActive: body.isActive !== false });
  return NextResponse.json({ category }, { status: 201 });
}

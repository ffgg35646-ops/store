import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Category, Product } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth";
import { slugify } from "@/lib/store";

const starterCategories = [
  "Streaming Accounts", "Gaming Accounts", "Social Media Accounts", "AI Tools & Accounts",
  "Software & Utilities", "Music & Audio", "Design & Creative", "VPN & Security",
  "Productivity Tools", "Gift Cards & Top-ups"
];

export async function POST() {
  const admin = await getCurrentUser();
  if (admin?.role !== "admin") return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  await dbConnect();
  let categoriesCreated = 0;
  let productsCreated = 0;
  for (let index = 0; index < starterCategories.length; index++) {
    const name = starterCategories[index];
    let category = await Category.findOne({ name });
    if (!category) {
      category = await Category.create({ name, slug: slugify(name), description: "Edit this category description in the admin dashboard.", sortOrder: index + 1, isActive: true });
      categoriesCreated++;
    }
    for (let productIndex = 1; productIndex <= 10; productIndex++) {
      const title = `${name} — Draft product ${String(productIndex).padStart(2, "0")}`;
      if (await Product.exists({ title, categoryId: category._id })) continue;
      const base = slugify(title);
      let slug = base;
      let suffix = 1;
      while (await Product.exists({ slug })) slug = `${base}-${suffix++}`;
      await Product.create({
        title, slug, shortDescription: "Draft item — replace with the real product details before publishing.",
        description: "This is an unpublished catalog placeholder. Add the real product name, images, price, delivery instructions and available stock before making it visible.",
        categoryId: category._id, price: 0, currency: process.env.NEXT_PUBLIC_STORE_CURRENCY || "USD",
        deliveryMode: "manual", isFeatured: false, isActive: false, sortOrder: productIndex
      });
      productsCreated++;
    }
  }
  return NextResponse.json({ success: true, categoriesCreated, productsCreated, message: `Starter catalog prepared: ${categoriesCreated} categories and ${productsCreated} unpublished draft products. Edit prices, images and details before publishing.` });
}

import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Category, Coupon, Product } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth";
import { slugify } from "@/lib/store";

const starterCategories = [
  ["Streaming & TV", "Movies, series, live TV and streaming memberships."],
  ["Netflix Accounts", "Netflix memberships and account plans."],
  ["Shahid & Arabic Streaming", "Shahid and other Arabic entertainment subscriptions."],
  ["Music & Audio", "Spotify, Apple Music and premium audio services."],
  ["Gaming & Gift Cards", "Gaming accounts, subscriptions, top-ups and gift cards."],
  ["PlayStation & Xbox", "Console memberships, online services and digital access."],
  ["Apple Services", "Apple IDs, iCloud accounts, Apple Music and Apple services."],
  ["Software & AI", "Software licenses, AI tools and digital productivity services."],
  ["Microsoft & Office", "Microsoft 365, Windows and Office products."],
  ["Adobe & Creative Software", "Creative Cloud, photo, video and design software."],
  ["VPN & Security", "VPN, privacy, antivirus and online security subscriptions."],
  ["Cloud Storage", "Cloud storage, backup and file-sharing services."],
  ["Productivity", "Work, learning and productivity memberships."],
  ["Design & Creative", "Design resources, creative tools and digital assets."],
  ["Social Media & Creator Tools", "Social media accounts, creator services and digital audience tools."],
  ["iPhone", "New and pre-owned iPhone devices and accessories."],
  ["iPad & Tablets", "iPad devices, tablets and related accessories."],
  ["MacBook & Laptops", "MacBook, Windows laptops and computing devices."],
  ["Smartwatches & Wearables", "Apple Watch, smart bands and wearable devices."],
  ["Home Appliances & Electronics", "Home appliances, headphones, screens, chargers and electronics."]
] as const;

// Move the previous starter-catalog categories into the new 20-category structure.
// Products and coupon targeting are reassigned before the legacy category is removed.
const legacyCategoryAliases = [
  ["Streaming Accounts", "Streaming & TV"],
  ["Gaming Accounts", "Gaming & Gift Cards"],
  ["Social Media Accounts", "Social Media & Creator Tools"],
  ["AI Tools & Accounts", "Software & AI"],
  ["Software & Utilities", "Software & AI"],
  ["Productivity Tools", "Productivity"],
  ["Gift Cards & Top-ups", "Gaming & Gift Cards"]
] as const;

export async function POST() {
  const admin = await getCurrentUser();
  if (admin?.role !== "admin") return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  await dbConnect();

  let categoriesCreated = 0;
  let categoriesUpdated = 0;
  let legacyCategoriesMerged = 0;
  let productsCreated = 0;
  const categoryByName = new Map<string, any>();

  for (let index = 0; index < starterCategories.length; index++) {
    const [name, description] = starterCategories[index];
    const slug = slugify(name);
    let category = await Category.findOne({ slug });
    if (!category) {
      category = await Category.create({ name, slug, description, sortOrder: index + 1, isActive: true });
      categoriesCreated++;
    } else {
      let changed = false;
      if (!category.description) {
        category.description = description;
        changed = true;
      }
      if (!Number(category.sortOrder)) {
        category.sortOrder = index + 1;
        changed = true;
      }
      if (changed) {
        await category.save();
        categoriesUpdated++;
      }
    }
    categoryByName.set(name, category);
  }

  for (const [legacyName, targetName] of legacyCategoryAliases) {
    const legacy = await Category.findOne({ name: legacyName });
    const target = categoryByName.get(targetName);
    if (!legacy || !target || String(legacy._id) === String(target._id)) continue;

    await Product.updateMany({ categoryId: legacy._id }, { $set: { categoryId: target._id } });
    await Coupon.updateMany({ targetType: "categories", targetIds: legacy._id }, { $addToSet: { targetIds: target._id } });
    await Coupon.updateMany({ targetCategoryIds: legacy._id }, { $addToSet: { targetCategoryIds: target._id } });
    await Coupon.updateMany({ targetType: "categories", targetIds: legacy._id }, { $pull: { targetIds: legacy._id } });
    await Coupon.updateMany({ targetCategoryIds: legacy._id }, { $pull: { targetCategoryIds: legacy._id } });
    await Category.deleteOne({ _id: legacy._id });
    legacyCategoriesMerged++;
  }

  const draftProducts: any[] = [];
  for (const [name] of starterCategories) {
    const category = categoryByName.get(name);
    const existingDrafts = await Product.find({ categoryId: category._id, isActive: false, price: 0 }).select("title").lean();
    const existingTitles = new Set(existingDrafts.map((item: any) => String(item.title)));
    for (let productIndex = 1; productIndex <= 10; productIndex++) {
      const title = `${name} — Draft product ${String(productIndex).padStart(2, "0")}`;
      if (existingTitles.has(title)) continue;
      draftProducts.push({
        title,
        slug: slugify(title),
        shortDescription: "Draft item — add the real product details before publishing.",
        description: "Unpublished catalog draft. Add the real product name, images, price, colors, delivery instructions and available stock before making it visible.",
        categoryId: category._id,
        price: 0,
        currency: process.env.NEXT_PUBLIC_STORE_CURRENCY || "USD",
        deliveryMode: "manual",
        isFeatured: false,
        isActive: false,
        sortOrder: productIndex
      });
    }
  }

  if (draftProducts.length) {
    const existingSlugs = new Set((await Product.find({ slug: { $in: draftProducts.map((item) => item.slug) } }).select("slug").lean()).map((item: any) => String(item.slug)));
    for (const item of draftProducts) {
      const base = item.slug;
      let suffix = 1;
      while (existingSlugs.has(item.slug)) item.slug = `${base}-${suffix++}`;
      existingSlugs.add(item.slug);
    }
    const created = await Product.insertMany(draftProducts, { ordered: false });
    productsCreated = created.length;
  }

  return NextResponse.json({
    success: true,
    categoriesCreated,
    categoriesUpdated,
    legacyCategoriesMerged,
    productsCreated,
    totalStarterCategories: starterCategories.length,
    message: `Catalog prepared: 20 categories and up to 200 unpublished product drafts. Add each real product's photo, price, colors, description and stock, then make it visible.`
  });
}

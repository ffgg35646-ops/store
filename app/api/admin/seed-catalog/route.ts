import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Category, Coupon, Order, Product } from "@/lib/models";
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

const legacyCategoryAliases = [
  ["Streaming Accounts", "Streaming & TV"],
  ["Gaming Accounts", "Gaming & Gift Cards"],
  ["Social Media Accounts", "Social Media & Creator Tools"],
  ["AI Tools & Accounts", "Software & AI"],
  ["Software & Utilities", "Software & AI"],
  ["Productivity Tools", "Productivity"],
  ["Gift Cards & Top-ups", "Gaming & Gift Cards"]
] as const;

const draftDescription = "Unpublished catalog draft. Add the real product name, images, price, colors, delivery instructions and available stock before making it visible.";

export async function POST() {
  const admin = await getCurrentUser();
  if (admin?.role !== "admin") return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  await dbConnect();

  let categoriesCreated = 0;
  let categoriesUpdated = 0;
  let legacyCategoriesMerged = 0;
  let productsCreated = 0;
  let unusedDraftsRemoved = 0;
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
      if (!category.description) { category.description = description; changed = true; }
      if (Number(category.sortOrder) !== index + 1) { category.sortOrder = index + 1; changed = true; }
      if (changed) { await category.save(); categoriesUpdated++; }
    }
    categoryByName.set(name, category);
  }

  // Move any earlier starter-catalog products into the matching new category.
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

  // Create 20 unpublished drafts in Apple Services and 3 drafts in every other section.
  // Only remove untouched, generated placeholder drafts if the old seed made too many.
  for (const [name] of starterCategories) {
    const category = categoryByName.get(name);
    const targetCount = name === "Apple Services" ? 20 : 3;
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const titlePattern = new RegExp(`^${escapedName} — Draft product [0-9]{2}$`);
    const generated = await Product.find({
      categoryId: category._id,
      title: titlePattern,
      isActive: false,
      price: 0,
      image: "",
      $or: [
        { shortDescription: "Draft item — add the real product details before publishing.", description: draftDescription },
        { shortDescription: "Draft item — replace with the real product details before publishing.", description: "This is an unpublished catalog placeholder. Add the real product name, images, price, delivery instructions and available stock before making it visible." }
      ]
    }).sort({ title: 1 }).lean();

    if (generated.length > targetCount) {
      const excess = generated.slice(targetCount);
      const excessIds = excess.map((item: any) => item._id);
      const usedIds = new Set((await Order.distinct("items.productId", { "items.productId": { $in: excessIds } })).map((id: any) => String(id)));
      const removableIds = excessIds.filter((id: any) => !usedIds.has(String(id)));
      if (removableIds.length) {
        const deleted = await Product.deleteMany({ _id: { $in: removableIds } });
        unusedDraftsRemoved += deleted.deletedCount || 0;
      }
    }

    const keptTitles = new Set(generated.slice(0, targetCount).map((item: any) => String(item.title)));
    let draftsForCategory = generated.filter((item: any) => keptTitles.has(String(item.title))).length;
    for (let productIndex = 1; productIndex <= targetCount && draftsForCategory < targetCount; productIndex++) {
      const title = `${name} — Draft product ${String(productIndex).padStart(2, "0")}`;
      if (keptTitles.has(title)) continue;
      const baseSlug = slugify(title);
      let slug = baseSlug;
      let suffix = 1;
      while (await Product.exists({ slug })) slug = `${baseSlug}-${suffix++}`;
      await Product.create({
        title,
        slug,
        shortDescription: "Draft item — add the real product details before publishing.",
        description: draftDescription,
        categoryId: category._id,
        price: 0,
        currency: process.env.NEXT_PUBLIC_STORE_CURRENCY || "USD",
        deliveryMode: "manual",
        isFeatured: false,
        isActive: false,
        sortOrder: productIndex
      });
      keptTitles.add(title);
      draftsForCategory++;
      productsCreated++;
    }
  }

  return NextResponse.json({
    success: true,
    categoriesCreated,
    categoriesUpdated,
    legacyCategoriesMerged,
    productsCreated,
    unusedDraftsRemoved,
    totalStarterCategories: starterCategories.length,
    productPlan: { appleServices: 20, otherCategories: 3, total: 77 },
    message: "Catalog prepared: 20 sections, 20 Apple Services drafts and 3 drafts in each remaining section. Drafts stay hidden until the administrator completes and publishes them."
  });
}

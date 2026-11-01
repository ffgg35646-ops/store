import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Category } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth";
import { slugify } from "@/lib/store";

const starterCategories = [
  ["Streaming & TV", "Streaming memberships and entertainment subscriptions."],
  ["Netflix Accounts", "Netflix memberships and account plans."],
  ["Shahid & Arabic Streaming", "Shahid and other Arabic entertainment subscriptions."],
  ["Music & Audio", "Spotify, Apple Music and premium audio services."],
  ["YouTube Premium", "YouTube Premium memberships and related services."],
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
  ["iPhone", "New and pre-owned iPhone devices and accessories."],
  ["iPad & Tablets", "iPad devices, tablets and related accessories."],
  ["MacBook & Laptops", "MacBook, Windows laptops and computing devices."],
  ["Smartwatches & Wearables", "Apple Watch, smart bands and wearable devices."],
  ["Home Appliances & Electronics", "Home appliances, headphones, screens, chargers and electronics."]
];

export async function POST() {
  const admin = await getCurrentUser();
  if (admin?.role !== "admin") return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  await dbConnect();

  let categoriesCreated = 0;
  let categoriesUpdated = 0;
  for (let index = 0; index < starterCategories.length; index++) {
    const [name, description] = starterCategories[index];
    const slug = slugify(name);
    const existing = await Category.findOne({ slug });
    if (existing) {
      if (!existing.description) {
        existing.description = description;
        await existing.save();
        categoriesUpdated++;
      }
      continue;
    }
    await Category.create({ name, slug, description, sortOrder: index + 1, isActive: true });
    categoriesCreated++;
  }

  return NextResponse.json({
    success: true,
    categoriesCreated,
    categoriesUpdated,
    totalStarterCategories: starterCategories.length,
    message: `Your 20 starter categories are ready. ${categoriesCreated} new categories were created. Add real product names, photos, prices, colors and stock from Product Catalog.`
  });
}

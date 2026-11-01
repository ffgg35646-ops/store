import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Category } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth";
import { slugify } from "@/lib/store";

const starterCategories = [
  ["Apple ID & iCloud Accounts", "Apple IDs, iCloud accounts and Apple account services."],
  ["Apple Music & TV", "Apple Music, Apple TV and Apple digital subscriptions."],
  ["Netflix Accounts", "Netflix memberships and streaming plans."],
  ["Shahid & Arabic Streaming", "Shahid and Arabic entertainment subscriptions."],
  ["Streaming Services", "Disney+, Prime Video and other streaming services."],
  ["Spotify & Music", "Music subscriptions and premium audio services."],
  ["YouTube Premium", "YouTube Premium and related creator services."],
  ["Gaming Accounts", "Gaming profiles, accounts and digital game access."],
  ["PlayStation & Xbox", "Console memberships, online services and subscriptions."],
  ["Game Gift Cards", "Gaming top-ups, wallet cards and digital codes."],
  ["AI Tools & Accounts", "AI assistants, image tools and productivity subscriptions."],
  ["Microsoft & Office", "Microsoft 365, Windows and Office products."],
  ["Adobe & Creative Software", "Creative Cloud, editing and design software."],
  ["VPN & Cybersecurity", "VPN, privacy, antivirus and security subscriptions."],
  ["iPhone", "New and pre-owned iPhone devices and accessories."],
  ["iPad & Tablets", "iPad devices, tablets and related accessories."],
  ["MacBook & Laptops", "MacBook, Windows laptops and computing devices."],
  ["Smartwatches & Wearables", "Apple Watch, smart bands and wearable devices."],
  ["Home Appliances", "Home and kitchen electrical appliances."],
  ["Electronics & Accessories", "Headphones, screens, chargers and consumer electronics."]
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

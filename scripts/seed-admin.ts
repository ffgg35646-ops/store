import mongoose from "mongoose";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());
import bcrypt from "bcryptjs";
import { User, Category } from "../lib/models";

async function main() {
  const uri = process.env.MONGODB_URI;
  const email = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD;
  if (!uri || !email || !password) throw new Error("Set MONGODB_URI, ADMIN_EMAIL and ADMIN_PASSWORD first.");
  if (password.length < 12) throw new Error("ADMIN_PASSWORD must contain at least 12 characters.");
  await mongoose.connect(uri);
  const hash = await bcrypt.hash(password, 12);
  await User.findOneAndUpdate(
    { email },
    { $set: { name: process.env.ADMIN_NAME || "Store Admin", email, password: hash, role: "admin", status: "active" } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  const defaults = [
    ["Streaming & TV", "Movies, series, live TV and streaming memberships."],
    ["Music & Audio", "Music subscriptions, podcasts and audio services."],
    ["Gaming & Gift Cards", "Game memberships, store credit and gaming products."],
    ["Apple Services", "Apple subscriptions, digital services and gift cards."],
    ["Software & AI", "Creative software, AI tools and productivity services."],
    ["VPN & Security", "Privacy, security and online protection services."],
    ["Cloud Storage", "Cloud storage, backup and file services."],
    ["Productivity", "Work, learning and productivity memberships."],
    ["Design & Creative", "Design assets, video and creative platforms."]
  ];
  for (const [name, description] of defaults) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    await Category.updateOne({ slug }, { $setOnInsert: { name, slug, description, isActive: true } }, { upsert: true });
  }
  console.log(`Admin account ready: ${email}`);
  console.log("Default catalog categories are ready. Add products and stock from the admin panel.");
  await mongoose.disconnect();
}

main().catch((error) => { console.error(error); process.exit(1); });

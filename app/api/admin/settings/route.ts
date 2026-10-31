import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Settings } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  await dbConnect();
  const settings = await Settings.findOneAndUpdate({ key: "store" }, { $setOnInsert: { key: "store" } }, { upsert: true, new: true }).lean();
  return NextResponse.json({ settings });
}
export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (user?.role !== "admin") return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  await dbConnect();
  const body = await request.json();
  const allowed = ["storeName", "tagline", "currency", "supportEmail", "manualPaymentTitle", "manualPaymentInstructions", "announcement", "maintenanceMode"];
  const update: any = {};
  for (const key of allowed) if (body[key] !== undefined) update[key] = body[key];
  const settings = await Settings.findOneAndUpdate({ key: "store" }, { $set: update, $setOnInsert: { key: "store" } }, { upsert: true, new: true, runValidators: true });
  return NextResponse.json({ settings });
}

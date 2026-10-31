import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Notification, User } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth";
import { notify } from "@/lib/store";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ notifications: [], unread: 0 });
  await dbConnect();
  const audience = { $or: [{ userId: user._id }, { userId: null, $or: [{ targetUserIds: { $size: 0 } }, { targetUserIds: user._id }] }] };
  const unread = await Notification.countDocuments({ $and: [audience, { readBy: { $ne: user._id } }] });
  const notifications = await Notification.find(audience).sort({ createdAt: -1 }).limit(50).lean();
  return NextResponse.json({ notifications: notifications.map((n: any) => ({ ...n, isRead: n.readBy.some((id: any) => String(id) === user._id) })), unread });
}
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (user?.role !== "admin") return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  await dbConnect();
  const body = await request.json();
  const title = String(body.title || "").trim(), message = String(body.body || "").trim();
  if (!title || !message) return NextResponse.json({ error: "Title and message are required." }, { status: 400 });
  let targetUserIds: any[] = [];
  if (body.targetType === "selected") {
    targetUserIds = Array.isArray(body.userIds) ? body.userIds : [];
    if (!targetUserIds.length) return NextResponse.json({ error: "Choose at least one customer." }, { status: 400 });
  } else if (body.targetType === "customers") {
    const customers = await User.find({ role: "customer", status: "active" }).select("_id");
    targetUserIds = customers.map((u: any) => u._id);
  }
  await notify({ targetUserIds, title, body: message, type: body.type || "promotion", href: body.href || "/account" });
  return NextResponse.json({ success: true, recipients: targetUserIds.length || "all customers" }, { status: 201 });
}

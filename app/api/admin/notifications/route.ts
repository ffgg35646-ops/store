import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Notification, User } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const admin = await getCurrentUser();
  if (admin?.role !== "admin") return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  await dbConnect();
  const notifications = await Notification.find()
    .sort({ createdAt: -1 })
    .limit(100)
    .populate("userId", "name email")
    .populate("targetUserIds", "name email")
    .lean();
  const customers = await User.countDocuments({ role: "customer", status: "active" });
  return NextResponse.json({
    notifications: notifications.map((item: any) => {
      const targeted = Array.isArray(item.targetUserIds) ? item.targetUserIds.length : 0;
      const direct = item.userId ? 1 : 0;
      const allCustomers = !item.userId && targeted === 0;
      return {
        ...item,
        recipientCount: allCustomers ? customers : targeted || direct,
        recipientLabel: allCustomers ? "All active customers" : item.userId?.name || (targeted ? `${targeted} selected customers` : "No recipients"),
        readCount: Array.isArray(item.readBy) ? item.readBy.length : 0
      };
    })
  });
}

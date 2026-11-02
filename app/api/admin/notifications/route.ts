import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Conversation, Notification, User } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const admin = await getCurrentUser();
  if (admin?.role !== "admin") return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  await dbConnect();
  const [notifications, customers, supportMessages, unreadTotals] = await Promise.all([
    Notification.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .populate("userId", "name email")
      .populate("targetUserIds", "name email")
      .lean(),
    User.countDocuments({ role: "customer", status: "active" }),
    Conversation.find({ status: "open", adminUnread: { $gt: 0 } })
      .select("_id userId subject lastMessage lastMessageAt adminUnread")
      .populate("userId", "name email")
      .sort({ lastMessageAt: -1 })
      .limit(30)
      .lean(),
    Conversation.aggregate([
      { $match: { status: "open", adminUnread: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: "$adminUnread" } } }
    ])
  ]);
  return NextResponse.json({
    notifications: notifications.map((item: any) => {
      const targeted = Array.isArray(item.targetUserIds) ? item.targetUserIds.length : 0;
      const direct = item.userId ? 1 : 0;
      const allCustomers = !item.userId && targeted === 0;
      return {
        ...item,
        recipientCount: allCustomers ? customers : targeted || direct,
        recipientLabel: allCustomers ? "جميع العملاء النشطين" : item.userId?.name || (targeted ? `${targeted} عملاء محددون` : "لا يوجد مستلمون"),
        readCount: Array.isArray(item.readBy) ? item.readBy.length : 0
      };
    }),
    supportMessages,
    unreadSupportCount: Number(unreadTotals[0]?.total || 0)
  });
}

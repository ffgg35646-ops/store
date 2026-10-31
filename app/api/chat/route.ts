import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Conversation, Message, User } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth";
import { notify } from "@/lib/store";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  await dbConnect();
  const filter = user.role === "admin" ? {} : { userId: user._id };
  const conversations = await Conversation.find(filter).populate("userId", "name email").sort({ lastMessageAt: -1 }).limit(100).lean();
  return NextResponse.json({ conversations });
}
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  await dbConnect();
  const body = await request.json();
  let conversation: any;
  if (user.role === "admin" && body.userId) {
    conversation = await Conversation.findOne({ userId: body.userId, status: "open" });
    if (!conversation) conversation = await Conversation.create({ userId: body.userId, subject: body.subject || "Support conversation" });
  } else {
    conversation = await Conversation.create({ userId: user._id, subject: String(body.subject || "Customer support").slice(0, 120), orderId: body.orderId || null });
  }
  const content = String(body.content || "").trim();
  if (!content) return NextResponse.json({ conversation }, { status: 201 });
  const message = await Message.create({ conversationId: conversation._id, senderId: user._id, senderRole: user.role, content: content.slice(0, 4000) });
  conversation.lastMessage = content.slice(0, 180);
  conversation.lastMessageAt = new Date();
  if (user.role === "admin") conversation.customerUnread += 1; else conversation.adminUnread += 1;
  await conversation.save();
  if (user.role === "customer") {
    const admins = await User.find({ role: "admin", status: "active" }).select("_id");
    await notify({ targetUserIds: admins.map((a: any) => a._id), title: "New customer message", body: content.slice(0, 120), type: "chat", href: "/admin/messages" });
  } else {
    await notify({ userId: conversation.userId, title: "New support reply", body: content.slice(0, 120), type: "chat", href: "/chat" });
  }
  return NextResponse.json({ conversation, message }, { status: 201 });
}

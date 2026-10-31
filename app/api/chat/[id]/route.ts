import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Conversation, Message, User } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth";
import { notify } from "@/lib/store";

async function getAccessibleConversation(id: string, user: any) {
  const conversation = await Conversation.findById(id);
  if (!conversation || (user.role !== "admin" && String(conversation.userId) !== user._id)) return null;
  return conversation;
}
export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  await dbConnect();
  const { id } = await context.params;
  const conversation = await getAccessibleConversation(id, user);
  if (!conversation) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  await Conversation.updateOne({ _id: id }, user.role === "admin" ? { $set: { adminUnread: 0 } } : { $set: { customerUnread: 0 } });
  const messages = await Message.find({ conversationId: id }).populate("senderId", "name role").sort({ createdAt: 1 }).limit(300).lean();
  return NextResponse.json({ conversation, messages });
}
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  await dbConnect();
  const { id } = await context.params;
  const conversation = await getAccessibleConversation(id, user);
  if (!conversation || conversation.status !== "open") return NextResponse.json({ error: "Conversation is unavailable." }, { status: 404 });
  const body = await request.json();
  const content = String(body.content || "").trim();
  if (!content || content.length > 4000) return NextResponse.json({ error: "Message must contain 1–4,000 characters." }, { status: 400 });
  const message = await Message.create({ conversationId: id, senderId: user._id, senderRole: user.role, content });
  conversation.lastMessage = content.slice(0, 180); conversation.lastMessageAt = new Date();
  if (user.role === "admin") conversation.customerUnread += 1; else conversation.adminUnread += 1;
  await conversation.save();
  if (user.role === "customer") {
    const admins = await User.find({ role: "admin", status: "active" }).select("_id");
    await notify({ targetUserIds: admins.map((a: any) => a._id), title: "New customer message", body: content.slice(0, 120), type: "chat", href: "/admin/messages" });
  } else await notify({ userId: conversation.userId, title: "New support reply", body: content.slice(0, 120), type: "chat", href: "/chat" });
  return NextResponse.json({ message }, { status: 201 });
}
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (user?.role !== "admin") return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  await dbConnect();
  const { id } = await context.params;
  const body = await request.json();
  const conversation = await Conversation.findByIdAndUpdate(id, { status: body.status === "closed" ? "closed" : "open" }, { new: true });
  if (!conversation) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  await notify({ userId: conversation.userId, title: body.status === "closed" ? "Support conversation closed" : "Support conversation reopened", body: "Your support conversation status has changed.", type: "chat", href: "/chat" });
  return NextResponse.json({ conversation });
}

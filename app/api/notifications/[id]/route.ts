import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Notification } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  await dbConnect();
  const { id } = await context.params;
  const result = await Notification.updateOne({
    _id: id,
    $or: [{ userId: user._id }, { userId: null, $or: [{ targetUserIds: { $size: 0 } }, { targetUserIds: user._id }] }]
  }, { $addToSet: { readBy: user._id } });
  if (!result.matchedCount) return NextResponse.json({ error: "Notification not found." }, { status: 404 });
  return NextResponse.json({ success: true });
}

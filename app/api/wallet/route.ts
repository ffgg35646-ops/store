import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { User, WalletTransaction } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  await dbConnect();
  const account = await User.findById(user._id).select("walletBalance points").lean();
  const transactions = await WalletTransaction.find({ userId: user._id }).sort({ createdAt: -1 }).limit(50).lean();
  return NextResponse.json({ account, transactions });
}

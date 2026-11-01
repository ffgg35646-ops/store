import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { User, WalletTransaction } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (user.role !== "customer") return NextResponse.json({ error: "Customer wallet access only." }, { status: 403 });
  await dbConnect();
  const account = await User.findById(user._id).select("walletBalance points").lean();
  const transactions = await WalletTransaction.find({ userId: user._id }).sort({ createdAt: -1 }).limit(50).lean();
  return NextResponse.json({ account, transactions });
}

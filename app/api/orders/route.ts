import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Order } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth";
import { localizeProduct } from "@/lib/product-localization";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  await dbConnect();
  const filter = user.role === "admin" ? {} : { userId: user._id };
  const orders = await Order.find(filter).populate("userId", "name email").sort({ createdAt: -1 }).limit(200).lean();
  const language = new URL(request.url).searchParams.get("lang") || "en";
  const localizedOrders = language === "ar" ? orders.map((order: any) => ({ ...order, items: (order.items || []).map((item: any) => item.slug ? { ...item, title: localizeProduct(item, "ar").title } : item) })) : orders;
  return NextResponse.json({ orders: localizedOrders });
}

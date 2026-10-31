import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Category, InventoryItem, Order, Product, User } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (user?.role !== "admin") return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  await dbConnect();
  const [products, categories, customers, orders, pendingOrders, availableStock, sales] = await Promise.all([
    Product.countDocuments({ isActive: true }), Category.countDocuments({ isActive: true }),
    User.countDocuments({ role: "customer", status: "active" }), Order.countDocuments(),
    Order.countDocuments({ status: "awaiting_payment" }), InventoryItem.countDocuments({ status: "available" }),
    Order.aggregate([{ $match: { paymentStatus: "paid" } }, { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } }])
  ]);
  return NextResponse.json({ stats: { products, categories, customers, orders, pendingOrders, availableStock, revenue: sales[0]?.total || 0, paidOrders: sales[0]?.count || 0 } });
}

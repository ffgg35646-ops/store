import { InventoryItem, Order } from "@/lib/models";
import { notify } from "@/lib/store";

export async function fulfillOrder(orderId: string) {
  const order = await Order.findById(orderId);
  if (!order || order.paymentStatus !== "paid") return order;

  let allDelivered = true;
  for (const item of order.items) {
    if (item.deliveryMode === "manual") {
      if (!item.deliveredData?.length) allDelivered = false;
      continue;
    }
    while ((item.deliveredData?.length || 0) < item.quantity) {
      const stock = await InventoryItem.findOneAndUpdate(
        { productId: item.productId, status: "available" },
        { $set: { status: "issued", orderId: order._id, userId: order.userId, issuedAt: new Date() } },
        { new: true, sort: { createdAt: 1 } }
      );
      if (!stock) {
        allDelivered = false;
        break;
      }
      item.deliveredData.push(stock.value);
    }
  }

  order.status = allDelivered ? "delivered" : "processing";
  if (allDelivered) order.deliveredAt = new Date();
  await order.save();

  if (allDelivered) {
    await notify({
      userId: order.userId,
      title: "Your digital order is ready",
      body: `Order ${order.orderNumber} has been delivered. Open your order to view the details.`,
      type: "delivery",
      href: `/orders/${order._id}`
    });
  } else {
    await notify({
      userId: order.userId,
      title: "Your order is being prepared",
      body: `Order ${order.orderNumber} is paid and is being prepared for delivery.`,
      type: "order",
      href: `/orders/${order._id}`
    });
  }
  return order;
}

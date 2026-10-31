import webpush from "web-push";
import { Notification, PushSubscription, User } from "@/lib/models";

export function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "item";
}

export function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export async function notify(input: {
  userId?: unknown | null;
  targetUserIds?: unknown[];
  title: string;
  body?: string;
  type?: string;
  href?: string;
}) {
  await Notification.create({
    userId: input.userId || null,
    targetUserIds: input.targetUserIds || [],
    title: input.title,
    body: input.body || "",
    type: input.type || "system",
    href: input.href || "/account"
  });
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (publicKey && privateKey) {
    try {
      webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:support@example.com", publicKey, privateKey);
      let recipientIds: any[] = input.userId ? [input.userId] : (input.targetUserIds || []);
      if (!input.userId && !recipientIds.length) {
        const customers = await User.find({ role: "customer", status: "active" }).select("_id");
        recipientIds = customers.map((customer: any) => customer._id);
      }
      if (recipientIds.length) {
        const subscriptions = await PushSubscription.find({ userId: { $in: recipientIds } }).lean();
        await Promise.all(subscriptions.map(async (row: any) => {
          try { await webpush.sendNotification(row.subscription, JSON.stringify({ title: input.title, body: input.body || "", href: input.href || "/account" })); }
          catch (error: any) { if (error?.statusCode === 404 || error?.statusCode === 410) await PushSubscription.deleteOne({ _id: row._id }); }
        }));
      }
    } catch (error) { console.error("push notification delivery", error); }
  }
}

export function safeUser(user: any) {
  if (!user) return null;
  const { password, ...rest } = typeof user.toObject === "function" ? user.toObject() : user;
  return { ...rest, _id: String(rest._id) };
}

import mongoose, { Schema } from "mongoose";

const { ObjectId } = Schema.Types;

const UserSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ["customer", "admin"], default: "customer" },
  status: { type: String, enum: ["active", "suspended", "deleted"], default: "active" },
  walletBalance: { type: Number, default: 0, min: 0 },
  points: { type: Number, default: 0, min: 0 },
  discountPercent: { type: Number, default: 0, min: 0, max: 100 },
  passwordResetTokenHash: { type: String, default: undefined, select: false },
  passwordResetExpiresAt: { type: Date, default: undefined, select: false },
  emailVerified: { type: Boolean, default: true },
  emailVerificationTokenHash: { type: String, default: undefined, select: false },
  emailVerificationExpiresAt: { type: Date, default: undefined, select: false },
  lastLoginAt: Date
}, { timestamps: true });

const CategorySchema = new Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, default: "" },
  image: { type: String, default: "" },
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const ProductSchema = new Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true },
  shortDescription: { type: String, default: "" },
  description: { type: String, default: "" },
  image: { type: String, default: "" },
  gallery: { type: [String], default: [] },
  colors: { type: [{ name: { type: String, required: true }, hex: { type: String, default: "#777777" } }], default: [] },
  categoryId: { type: ObjectId, ref: "Category", required: true },
  price: { type: Number, required: true, min: 0 },
  compareAtPrice: { type: Number, default: 0, min: 0 },
  currency: { type: String, default: "USD" },
  deliveryMode: { type: String, enum: ["automatic", "manual"], default: "automatic" },
  deliveryInstructions: { type: String, default: "" },
  isFeatured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
  salesCount: { type: Number, default: 0 }
}, { timestamps: true });

const InventoryItemSchema = new Schema({
  productId: { type: ObjectId, ref: "Product", required: true, index: true },
  value: { type: String, required: true },
  status: { type: String, enum: ["available", "issued"], default: "available", index: true },
  orderId: { type: ObjectId, ref: "Order", default: null },
  userId: { type: ObjectId, ref: "User", default: null },
  issuedAt: Date
}, { timestamps: true });

const OrderItemSchema = new Schema({
  productId: { type: ObjectId, ref: "Product", required: true },
  title: String,
  slug: String,
  image: String,
  variant: { type: String, default: "" },
  quantity: { type: Number, default: 1 },
  unitPrice: Number,
  deliveryMode: { type: String, enum: ["automatic", "manual"] },
  deliveredData: { type: [String], default: [] },
  deliveryNote: { type: String, default: "" }
}, { _id: false });

const OrderSchema = new Schema({
  orderNumber: { type: String, required: true, unique: true },
  userId: { type: ObjectId, ref: "User", required: true, index: true },
  items: { type: [OrderItemSchema], required: true },
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  currency: { type: String, default: "USD" },
  couponCode: { type: String, default: "" },
  paymentMethod: { type: String, enum: ["wallet", "stripe", "manual"], required: true },
  paymentStatus: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending" },
  status: { type: String, enum: ["awaiting_payment", "processing", "delivered", "completed", "cancelled", "refunded"], default: "awaiting_payment" },
  paymentReference: { type: String, default: "" },
  stripeSessionId: { type: String, default: "" },
  adminNote: { type: String, default: "" },
  paidAt: Date,
  deliveredAt: Date
}, { timestamps: true });

const CouponSchema = new Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  description: { type: String, default: "" },
  discountType: { type: String, enum: ["percentage", "fixed"], default: "percentage" },
  value: { type: Number, required: true, min: 0 },
  minOrder: { type: Number, default: 0 },
  maxDiscount: { type: Number, default: 0 },
  startsAt: Date,
  endsAt: Date,
  usageLimit: { type: Number, default: 0 },
  usedCount: { type: Number, default: 0 },
  targetType: { type: String, enum: ["all", "users", "products", "categories"], default: "all" },
  targetIds: [{ type: ObjectId }],
  active: { type: Boolean, default: true }
}, { timestamps: true });

const NotificationSchema = new Schema({
  userId: { type: ObjectId, ref: "User", default: null, index: true },
  targetUserIds: [{ type: ObjectId, ref: "User" }],
  title: { type: String, required: true },
  body: { type: String, default: "" },
  type: { type: String, enum: ["order", "payment", "delivery", "chat", "reward", "promotion", "system"], default: "system" },
  href: { type: String, default: "/account" },
  readBy: [{ type: ObjectId, ref: "User" }]
}, { timestamps: true });

const ConversationSchema = new Schema({
  userId: { type: ObjectId, ref: "User", required: true, index: true },
  subject: { type: String, default: "Support conversation" },
  orderId: { type: ObjectId, ref: "Order", default: null },
  lastMessage: { type: String, default: "" },
  lastMessageAt: { type: Date, default: Date.now },
  customerUnread: { type: Number, default: 0 },
  adminUnread: { type: Number, default: 0 },
  status: { type: String, enum: ["open", "closed"], default: "open" }
}, { timestamps: true });

const MessageSchema = new Schema({
  conversationId: { type: ObjectId, ref: "Conversation", required: true, index: true },
  senderId: { type: ObjectId, ref: "User", required: true },
  senderRole: { type: String, enum: ["customer", "admin"], required: true },
  content: { type: String, required: true, maxlength: 4000 }
}, { timestamps: true });

const WalletTransactionSchema = new Schema({
  userId: { type: ObjectId, ref: "User", required: true, index: true },
  type: { type: String, enum: ["credit", "debit", "refund", "reward", "adjustment"], required: true },
  amount: { type: Number, required: true },
  balanceAfter: { type: Number, required: true },
  reference: { type: String, default: "" },
  note: { type: String, default: "" },
  createdBy: { type: ObjectId, ref: "User", default: null }
}, { timestamps: true });

const PushSubscriptionSchema = new Schema({
  userId: { type: ObjectId, ref: "User", required: true, index: true },
  endpoint: { type: String, required: true, unique: true },
  subscription: { type: Schema.Types.Mixed, required: true }
}, { timestamps: true });

const SettingsSchema = new Schema({
  key: { type: String, unique: true, default: "store" },
  storeName: { type: String, default: "Nova Digital" },
  tagline: { type: String, default: "Your digital world, one click away." },
  currency: { type: String, default: "USD" },
  supportEmail: { type: String, default: "" },
  manualPaymentTitle: { type: String, default: "Bank transfer" },
  manualPaymentInstructions: { type: String, default: "Contact support for payment instructions." },
  announcement: { type: String, default: "" },
  maintenanceMode: { type: Boolean, default: false }
}, { timestamps: true });

export const User: any = mongoose.models.User || mongoose.model("User", UserSchema);
export const Category: any = mongoose.models.Category || mongoose.model("Category", CategorySchema);
export const Product: any = mongoose.models.Product || mongoose.model("Product", ProductSchema);
export const InventoryItem: any = mongoose.models.InventoryItem || mongoose.model("InventoryItem", InventoryItemSchema);
export const Order: any = mongoose.models.Order || mongoose.model("Order", OrderSchema);
export const Coupon: any = mongoose.models.Coupon || mongoose.model("Coupon", CouponSchema);
export const Notification: any = mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);
export const Conversation: any = mongoose.models.Conversation || mongoose.model("Conversation", ConversationSchema);
export const Message: any = mongoose.models.Message || mongoose.model("Message", MessageSchema);
export const WalletTransaction: any = mongoose.models.WalletTransaction || mongoose.model("WalletTransaction", WalletTransactionSchema);
export const Settings: any = mongoose.models.Settings || mongoose.model("Settings", SettingsSchema);
export const PushSubscription: any = mongoose.models.PushSubscription || mongoose.model("PushSubscription", PushSubscriptionSchema);

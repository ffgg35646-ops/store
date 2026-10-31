import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } | undefined;
}
const cache = global.mongooseCache ?? (global.mongooseCache = { conn: null, promise: null });

export async function dbConnect() {
  if (!MONGODB_URI) throw new Error("MONGODB_URI is missing. Copy .env.example to .env.local and configure MongoDB.");
  if (cache.conn) return cache.conn;
  if (!cache.promise) cache.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false, maxPoolSize: 10 });
  try { cache.conn = await cache.promise; }
  catch (error) { cache.promise = null; throw error; }
  return cache.conn;
}

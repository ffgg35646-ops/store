import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
export async function GET() {
  await dbConnect();
  return NextResponse.json({ user: await getCurrentUser() });
}

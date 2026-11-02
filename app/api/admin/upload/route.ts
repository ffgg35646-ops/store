import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

const allowedContentTypes = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];

export async function POST(request: NextRequest) {
  const admin = await getCurrentUser();
  if (admin?.role !== "admin") {
    return NextResponse.json({ error: "يلزم تسجيل دخول الإدارة لرفع الصور." }, { status: 403 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "تخزين الصور غير مفعّل بعد. اربط Vercel Blob بالمشروع وأضف BLOB_READ_WRITE_TOKEN." },
      { status: 503 }
    );
  }

  try {
    const body = (await request.json()) as HandleUploadBody;
    const response = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!/^(products|categories)\//.test(pathname)) {
          throw new Error("مسار رفع الصور غير مسموح.");
        }
        return {
          allowedContentTypes,
          maximumSizeInBytes: 10 * 1024 * 1024,
          tokenPayload: JSON.stringify({ adminId: String(admin._id) })
        };
      }
    });
    return NextResponse.json(response);
  } catch (error) {
    console.error("admin image upload failed", error);
    return NextResponse.json(
      { error: "تعذر تجهيز رفع الصورة. تحقق من إعداد Vercel Blob وحاول مرة أخرى." },
      { status: 400 }
    );
  }
}

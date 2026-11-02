import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

const allowedContentTypes = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];

export async function POST(request: NextRequest) {
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
        const admin = await getCurrentUser();
        if (admin?.role !== "admin") {
          throw new Error("يلزم تسجيل دخول الإدارة لرفع الصور.");
        }
        if (!/^(products|categories)\//.test(pathname)) {
          throw new Error("مسار رفع الصور غير مسموح.");
        }
        return {
          allowedContentTypes,
          maximumSizeInBytes: 10 * 1024 * 1024,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ adminId: String(admin._id) })
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Completion callbacks are authenticated by Vercel Blob's signed payload.
        // The browser saves blob.url into the product or category form after upload().
        console.info("Admin image upload completed", {
          pathname: blob.pathname,
          adminId: tokenPayload ? JSON.parse(tokenPayload).adminId : undefined
        });
      }
    });
    return NextResponse.json(response);
  } catch (error) {
    console.error("admin image upload failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "تعذر تجهيز رفع الصورة. تحقق من إعداد Vercel Blob وحاول مرة أخرى." },
      { status: 400 }
    );
  }
}

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { LIMITS } from "@/lib/db";
import { saveImage } from "@/lib/media";
import { fail, handleError, json, requireAdmin } from "@/lib/api";

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(true);
  if (admin instanceof NextResponse) return admin;
  const len = Number(req.headers.get("content-length") || 0);
  if (len > LIMITS.maxImageBytes + 64 * 1024) return fail(`حجم الصورة يتجاوز الحد المسموح (${LIMITS.maxImageBytes / 1024 / 1024}MB).`, 413);
  try {
    const file = (await req.formData()).get("file");
    if (!(file instanceof Blob)) return fail("لم يتم إرسال ملف.");
    return json({ url: saveImage(Buffer.from(await file.arrayBuffer())) }, 201);
  } catch (e) {
    return handleError(e);
  }
}

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { LIMITS, LimitError, createSlide, listSlides, reorderSlides, slideLimit } from "@/lib/db";
import { mediaName } from "@/lib/media";
import { handleError, json, requireAdmin } from "@/lib/api";
import { SLIDE_AREAS, type SlideArea } from "@/lib/posts";

export const dynamic = "force-dynamic";

/** القسم من ?area= (الافتراضي: hero) */
function areaOf(req: NextRequest): SlideArea {
  const a = req.nextUrl.searchParams.get("area") || "hero";
  if (!SLIDE_AREAS.includes(a as SlideArea)) throw new LimitError("قسم غير معروف.");
  return a as SlideArea;
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  try {
    const area = areaOf(req);
    return json({ slides: listSlides(area), max: slideLimit(area), max_image_bytes: LIMITS.maxImageBytes });
  } catch (e) {
    return handleError(e);
  }
}

/** إضافة صورة (بعد رفعها عبر /api/admin/upload/) */
export async function POST(req: NextRequest) {
  const admin = await requireAdmin(true);
  if (admin instanceof NextResponse) return admin;
  try {
    const area = areaOf(req);
    const { image_url, alt } = (await req.json()) as { image_url?: string; alt?: string };
    if (!mediaName(image_url)) throw new LimitError("رابط الصورة غير صالح.");
    const cleanAlt = typeof alt === "string" && alt.trim() ? alt.trim().slice(0, 200) : null;
    return json(createSlide(area, image_url!, cleanAlt), 201);
  } catch (e) {
    return handleError(e);
  }
}

/** إعادة الترتيب: { order: [id, id, ...] } */
export async function PUT(req: NextRequest) {
  const admin = await requireAdmin(true);
  if (admin instanceof NextResponse) return admin;
  try {
    const area = areaOf(req);
    const { order } = (await req.json()) as { order?: unknown };
    if (!Array.isArray(order) || !order.every((x) => typeof x === "string")) throw new LimitError("ترتيب غير صالح.");
    reorderSlides(area, order as string[]);
    return json(listSlides(area));
  } catch (e) {
    return handleError(e);
  }
}

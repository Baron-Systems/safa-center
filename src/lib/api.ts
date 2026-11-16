// أدوات مشتركة لمسارات API الإدارية — للسيرفر فقط.
import { NextResponse } from "next/server";
import { currentAdmin, sameOrigin, type Admin } from "./auth";
import { LIMITS, LimitError } from "./db";
import { mediaName } from "./media";
import type { DoctorInput, PostInput } from "./posts";

export const json = (data: unknown, status = 200) => NextResponse.json(data, { status });
export const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

/** يُرجع المشرف أو رد خطأ جاهز. للطلبات المعدِّلة يتحقق أيضاً أن الطلب من نفس الموقع. */
export async function requireAdmin(mutating = false): Promise<Admin | NextResponse> {
  if (mutating && !(await sameOrigin())) return fail("طلب مرفوض", 403);
  const admin = await currentAdmin();
  return admin ?? fail("يجب تسجيل الدخول", 401);
}

export function handleError(e: unknown) {
  if (e instanceof LimitError) return fail(e.message, 413);
  console.error(e);
  return fail("حدث خطأ في السيرفر", 500);
}

const str = (v: unknown, max: number) => {
  if (v == null || v === "") return null;
  if (typeof v !== "string") throw new LimitError("قيمة غير صالحة");
  const s = v.trim();
  if (s.length > max) throw new LimitError(`النص أطول من المسموح (${max} حرف).`);
  return s || null;
};

/** يتحقق من بيانات عضو الطاقم الطبي. */
export function parseDoctorInput(body: unknown): DoctorInput {
  const b = (body ?? {}) as Record<string, unknown>;
  const name_ar = str(b.name_ar, 120);
  if (!name_ar) throw new LimitError("الاسم مطلوب.");
  const photo_url = str(b.photo_url, 300);
  if (photo_url && !mediaName(photo_url)) throw new LimitError("رابط الصورة غير صالح.");
  return {
    name_ar,
    name_en: str(b.name_en, 120),
    title_ar: str(b.title_ar, 200),
    title_en: str(b.title_en, 200),
    bio_ar: str(b.bio_ar, 2000),
    bio_en: str(b.bio_en, 2000),
    photo_url,
    published: b.published !== false,
  };
}

/** يتحقق من بيانات المنشور القادمة من لوحة التحكم ويُرجعها نظيفة. */
export function parsePostInput(body: unknown): PostInput {
  const b = (body ?? {}) as Record<string, unknown>;
  const kind = b.kind === "event" ? "event" : "news";
  const title_ar = str(b.title_ar, LIMITS.titleMax);
  if (!title_ar) throw new LimitError("العنوان مطلوب.");
  const cover_url = str(b.cover_url, 300);
  if (cover_url && !mediaName(cover_url)) throw new LimitError("رابط الصورة غير صالح.");
  let event_date: string | null = null;
  if (kind === "event" && b.event_date) {
    const d = new Date(String(b.event_date));
    if (isNaN(d.getTime())) throw new LimitError("تاريخ الحدث غير صالح.");
    event_date = d.toISOString();
  }
  return {
    kind,
    title_ar,
    title_en: str(b.title_en, LIMITS.titleMax),
    body_ar: str(b.body_ar, LIMITS.bodyMax) ?? "",
    body_en: str(b.body_en, LIMITS.bodyMax),
    cover_url,
    event_date,
    location: kind === "event" ? str(b.location, 200) : null,
    published: Boolean(b.published),
  };
}

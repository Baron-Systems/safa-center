// تخزين الصور على قرص السيرفر داخل DATA_DIR/uploads — للسيرفر فقط.
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { LIMITS, LimitError, UPLOAD_DIR, db, referencedMedia } from "./db";

export const MEDIA_PREFIX = "/media/";
export const MEDIA_NAME_RE = /^[0-9a-f-]{36}\.(webp|jpg|png)$/;

export const MIME: Record<string, string> = { webp: "image/webp", jpg: "image/jpeg", png: "image/png" };

/** يتعرّف على نوع الصورة من محتواها الفعلي (وليس من الاسم). */
function sniff(buf: Buffer): "webp" | "jpg" | "png" | null {
  if (buf.length > 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "webp";
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  return null;
}

export function mediaUsageBytes(): number {
  db(); // يضمن وجود المجلد
  return fs.readdirSync(UPLOAD_DIR).reduce((sum, f) => sum + fs.statSync(path.join(UPLOAD_DIR, f)).size, 0);
}

/** اسم الملف من الرابط /media/xxx.webp، أو null إن لم يكن ملفاً محلياً صالحاً. */
export function mediaName(url: string | null | undefined): string | null {
  if (!url?.startsWith(MEDIA_PREFIX)) return null;
  const name = url.slice(MEDIA_PREFIX.length);
  return MEDIA_NAME_RE.test(name) ? name : null;
}

export function removeMedia(url: string | null | undefined) {
  const name = mediaName(url);
  if (name) fs.rmSync(path.join(UPLOAD_DIR, name), { force: true });
}

/** يحذف الصور غير المرتبطة بأي منشور والأقدم من يوم (صور رُفعت ثم أُلغي المنشور). */
export function cleanupOrphans() {
  const used = referencedMedia();
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  for (const f of fs.readdirSync(UPLOAD_DIR)) {
    const full = path.join(UPLOAD_DIR, f);
    if (!used.has(MEDIA_PREFIX + f) && fs.statSync(full).mtimeMs < cutoff) fs.rmSync(full, { force: true });
  }
}

export function saveImage(buf: Buffer): string {
  if (buf.length > LIMITS.maxImageBytes) throw new LimitError(`حجم الصورة يتجاوز الحد المسموح (${LIMITS.maxImageBytes / 1024 / 1024}MB).`);
  const ext = sniff(buf);
  if (!ext) throw new LimitError("نوع الملف غير مدعوم. المسموح: WebP أو JPEG أو PNG.");
  cleanupOrphans();
  if (mediaUsageBytes() + buf.length > LIMITS.mediaQuotaBytes)
    throw new LimitError("امتلأت مساحة الصور المخصصة. احذف منشورات أو صوراً قديمة ثم حاول مجدداً.");
  const name = `${randomUUID()}.${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, name), buf);
  return MEDIA_PREFIX + name;
}

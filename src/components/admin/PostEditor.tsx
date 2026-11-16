"use client";

import { useState } from "react";
import type { Post, PostKind } from "@/lib/posts";
import { api, Field } from "./AdminApp";
import { compressImage } from "./image";

/** ISO → قيمة حقل datetime-local بالتوقيت المحلي */
function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export default function PostEditor({
  post,
  maxImageBytes,
  onClose,
}: {
  post: Post | null;
  maxImageBytes: number;
  onClose: (saved: boolean) => void;
}) {
  const [kind, setKind] = useState<PostKind>(post?.kind ?? "news");
  const [titleAr, setTitleAr] = useState(post?.title_ar ?? "");
  const [bodyAr, setBodyAr] = useState(post?.body_ar ?? "");
  const [titleEn, setTitleEn] = useState(post?.title_en ?? "");
  const [bodyEn, setBodyEn] = useState(post?.body_en ?? "");
  const [cover, setCover] = useState(post?.cover_url ?? "");
  const [eventDate, setEventDate] = useState(toLocalInput(post?.event_date ?? null));
  const [location, setLocation] = useState(post?.location ?? "");
  const [published, setPublished] = useState(post?.published ?? true);
  const [showEn, setShowEn] = useState(Boolean(post?.title_en));
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // ملاحظة: الصور التي تُرفع ثم يُلغى المنشور يحذفها السيرفر تلقائياً بعد يوم.
  async function upload(file: File) {
    setUploading(true);
    setError("");
    try {
      const blob = await compressImage(file, maxImageBytes);
      const form = new FormData();
      form.append("file", blob, blob.type === "image/webp" ? "image.webp" : "image.jpg");
      const { url } = await api<{ url: string }>("/api/admin/upload/", { method: "POST", body: form });
      setCover(url);
    } catch (e) {
      setError((e as Error).message);
    }
    setUploading(false);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const row = {
      kind,
      title_ar: titleAr,
      body_ar: bodyAr,
      title_en: titleEn,
      body_en: bodyEn,
      cover_url: cover || null,
      event_date: kind === "event" && eventDate ? new Date(eventDate).toISOString() : null,
      location,
      published,
    };
    try {
      await api(post ? `/api/admin/posts/${post.id}/` : "/api/admin/posts/", {
        method: post ? "PUT" : "POST",
        body: JSON.stringify(row),
      });
      onClose(true);
    } catch (err) {
      setError("تعذّر الحفظ: " + (err as Error).message);
    }
    setSaving(false);
  }

  return (
    <form onSubmit={save} className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-navy-900">{post ? "تعديل" : "إضافة جديد"}</h1>
        <button type="button" onClick={() => onClose(false)} className="text-sm text-ink-soft hover:text-navy-800">
          → رجوع
        </button>
      </div>

      <div className="mt-6 space-y-6 rounded-2xl border border-line bg-white p-6 md:p-8">
        <div>
          <span className="mb-1.5 block text-sm font-semibold text-navy-900">النوع</span>
          <div className="inline-flex rounded-full border border-line p-1">
            {(
              [
                ["news", "خبر"],
                ["event", "حدث / فعالية"],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={`rounded-full px-5 py-1.5 text-sm font-medium ${kind === k ? "bg-navy-800 text-white" : "text-ink-soft"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <Field label="العنوان *">
          <input required value={titleAr} onChange={(e) => setTitleAr(e.target.value)} className="input" maxLength={200} />
        </Field>

        <Field label="النص" hint="كل سطر جديد يظهر كما هو في الموقع.">
          <textarea value={bodyAr} onChange={(e) => setBodyAr(e.target.value)} rows={8} className="input leading-relaxed" />
        </Field>

        {kind === "event" && (
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="موعد الحدث">
              <input type="datetime-local" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="input" />
            </Field>
            <Field label="المكان">
              <input value={location} onChange={(e) => setLocation(e.target.value)} className="input" placeholder="مثلاً: مبنى الصفا – الطابق السادس" />
            </Field>
          </div>
        )}

        <div>
          <span className="mb-1.5 block text-sm font-semibold text-navy-900">صورة الغلاف</span>
          {cover ? (
            <div className="relative">
              <img src={cover} alt="" className="max-h-72 w-full rounded-xl border border-line object-cover" />
              <button
                type="button"
                onClick={() => setCover("")}
                className="absolute start-3 top-3 rounded-full bg-white/95 px-3 py-1 text-sm text-red-700 shadow"
              >
                إزالة
              </button>
            </div>
          ) : (
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-line bg-navy-50 p-8 text-center text-sm text-ink-soft hover:border-teal">
              {uploading ? "جارٍ الرفع…" : "اضغط لاختيار صورة (تُضغط تلقائياً)"}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={uploading}
                onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
              />
            </label>
          )}
        </div>

        <div className="border-t border-line pt-6">
          <button type="button" onClick={() => setShowEn((v) => !v)} className="text-sm font-semibold text-teal-700">
            {showEn ? "−" : "+"} النسخة الإنجليزية (اختياري)
          </button>
          {showEn && (
            <div className="mt-4 space-y-4" dir="ltr">
              <Field label="Title (English)">
                <input value={titleEn} onChange={(e) => setTitleEn(e.target.value)} className="input font-en" maxLength={200} />
              </Field>
              <Field label="Text (English)">
                <textarea value={bodyEn} onChange={(e) => setBodyEn(e.target.value)} rows={6} className="input font-en leading-relaxed" />
              </Field>
            </div>
          )}
          {!showEn && <p className="mt-1 text-xs text-ink-mute">إن تُركت فارغة تظهر النسخة العربية في الموقع الإنجليزي.</p>}
        </div>

        <label className="flex items-center gap-3 border-t border-line pt-6">
          <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="h-5 w-5 accent-navy-800" />
          <span className="font-semibold text-navy-900">نشر على الموقع</span>
          <span className="text-sm text-ink-mute">(بدون تحديد يُحفظ كمسودة)</span>
        </label>
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p>}

      <div className="mt-6 flex gap-3">
        <button disabled={saving || uploading} className="btn-primary disabled:opacity-60">
          {saving ? "جارٍ الحفظ…" : "حفظ"}
        </button>
        <button type="button" onClick={() => onClose(false)} className="btn-outline">
          إلغاء
        </button>
      </div>
    </form>
  );
}

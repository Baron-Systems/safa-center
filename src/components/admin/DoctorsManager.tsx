"use client";

import { useCallback, useEffect, useState } from "react";
import type { Doctor } from "@/lib/posts";
import { api, Field } from "./AdminApp";
import { uploadImage } from "./image";

type ListResponse = { doctors: Doctor[]; max: number; max_image_bytes: number };

/** إدارة الطاقم الطبي: إضافة، تعديل، ترتيب، إخفاء، حذف. */
export default function DoctorsManager({ onUnauthorized }: { onUnauthorized: () => void }) {
  const [data, setData] = useState<ListResponse | null>(null);
  const [editing, setEditing] = useState<Doctor | "new" | null>(null);
  const [error, setError] = useState("");

  const fail = useCallback(
    (e: unknown) => {
      if ((e as { status?: number }).status === 401) onUnauthorized();
      else setError((e as Error).message);
    },
    [onUnauthorized],
  );

  const load = useCallback(async () => {
    try {
      setData(await api<ListResponse>("/api/admin/doctors/"));
    } catch (e) {
      fail(e);
    }
  }, [fail]);

  useEffect(() => {
    load();
  }, [load]);

  if (editing)
    return (
      <DoctorEditor
        doctor={editing === "new" ? null : editing}
        maxImageBytes={data?.max_image_bytes ?? 2 * 1024 * 1024}
        onUnauthorized={onUnauthorized}
        onClose={(saved) => {
          setEditing(null);
          if (saved) load();
        }}
      />
    );

  const doctors = data?.doctors;

  async function move(index: number, dir: -1 | 1) {
    if (!doctors || !data) return;
    const next = [...doctors];
    const [item] = next.splice(index, 1);
    next.splice(index + dir, 0, item);
    setData({ ...data, doctors: next });
    try {
      await api("/api/admin/doctors/", { method: "PUT", body: JSON.stringify({ order: next.map((d) => d.id) }) });
    } catch (e) {
      fail(e);
      load();
    }
  }

  async function togglePublished(d: Doctor) {
    try {
      await api(`/api/admin/doctors/${d.id}/`, { method: "PUT", body: JSON.stringify({ ...d, published: !d.published }) });
      load();
    } catch (e) {
      fail(e);
    }
  }

  async function remove(d: Doctor) {
    if (!confirm(`حذف «${d.name_ar}» من الطاقم الطبي؟`)) return;
    try {
      await api(`/api/admin/doctors/${d.id}/`, { method: "DELETE" });
      load();
    } catch (e) {
      fail(e);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">الطاقم الطبي</h1>
          <p className="mt-1 text-sm text-ink-soft">يظهر الأطباء المنشورون في صفحة «الطاقم الطبي» بنفس الترتيب هنا.</p>
        </div>
        <button onClick={() => setEditing("new")} className="btn-primary !py-2.5">
          + إضافة طبيب
        </button>
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {!doctors && !error && <p className="mt-10 text-center text-ink-mute">جارٍ التحميل…</p>}
      {doctors && doctors.length === 0 && (
        <p className="mt-6 rounded-2xl border border-dashed border-line bg-white p-10 text-center text-ink-soft">
          لم تتم إضافة أي طبيب بعد. اضغط «إضافة طبيب».
        </p>
      )}

      <ul className="mt-6 space-y-3">
        {doctors?.map((d, i) => (
          <li key={d.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-white p-3 sm:flex-nowrap">
            <Avatar src={d.photo_url} className="h-16 w-16 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold text-navy-900">
                {d.name_ar}
                {!d.published && <span className="ms-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">مخفي</span>}
              </p>
              <p className="truncate text-sm text-ink-soft">{d.title_ar || "—"}</p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-sm">
              <button onClick={() => move(i, -1)} disabled={i === 0} title="تقديم" aria-label="تقديم" className="rounded-full border border-line px-3 py-1.5 text-navy-800 hover:bg-navy-50 disabled:opacity-30">
                ↑
              </button>
              <button onClick={() => move(i, 1)} disabled={i === doctors.length - 1} title="تأخير" aria-label="تأخير" className="rounded-full border border-line px-3 py-1.5 text-navy-800 hover:bg-navy-50 disabled:opacity-30">
                ↓
              </button>
              <button onClick={() => setEditing(d)} className="rounded-full border border-line px-3 py-1.5 text-navy-800 hover:bg-navy-50">
                تعديل
              </button>
              <button onClick={() => togglePublished(d)} className="rounded-full border border-line px-3 py-1.5 text-navy-800 hover:bg-navy-50">
                {d.published ? "إخفاء" : "إظهار"}
              </button>
              <button onClick={() => remove(d)} className="rounded-full border border-red-200 px-3 py-1.5 text-red-700 hover:bg-red-50">
                حذف
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Avatar({ src, className = "" }: { src: string | null; className?: string }) {
  return src ? (
    <img src={src} alt="" className={`object-cover object-top ${className}`} />
  ) : (
    <span className={`flex items-center justify-center bg-navy-50 ${className}`}>
      <img src="/brand/mark-color.svg" alt="" className="h-1/2 w-auto opacity-40" />
    </span>
  );
}

function DoctorEditor({
  doctor,
  maxImageBytes,
  onClose,
  onUnauthorized,
}: {
  doctor: Doctor | null;
  maxImageBytes: number;
  onClose: (saved: boolean) => void;
  onUnauthorized: () => void;
}) {
  const [f, setF] = useState({
    name_ar: doctor?.name_ar ?? "",
    title_ar: doctor?.title_ar ?? "",
    bio_ar: doctor?.bio_ar ?? "",
    name_en: doctor?.name_en ?? "",
    title_en: doctor?.title_en ?? "",
    bio_en: doctor?.bio_en ?? "",
    photo_url: doctor?.photo_url ?? "",
    published: doctor?.published ?? true,
  });
  const [showEn, setShowEn] = useState(Boolean(doctor?.name_en));
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  function handle(e: unknown, prefix = "") {
    if ((e as { status?: number }).status === 401) onUnauthorized();
    else setError(prefix + (e as Error).message);
  }

  async function upload(file: File) {
    setUploading(true);
    setError("");
    try {
      const url = await uploadImage(file, maxImageBytes, api, 900);
      setF((v) => ({ ...v, photo_url: url }));
    } catch (e) {
      handle(e);
    }
    setUploading(false);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api(doctor ? `/api/admin/doctors/${doctor.id}/` : "/api/admin/doctors/", {
        method: doctor ? "PUT" : "POST",
        body: JSON.stringify({ ...f, photo_url: f.photo_url || null }),
      });
      onClose(true);
    } catch (err) {
      handle(err, "تعذّر الحفظ: ");
    }
    setSaving(false);
  }

  return (
    <form onSubmit={save} className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-navy-900">{doctor ? "تعديل بيانات الطبيب" : "إضافة طبيب"}</h1>
        <button type="button" onClick={() => onClose(false)} className="text-sm text-ink-soft hover:text-navy-800">
          → رجوع
        </button>
      </div>

      <div className="mt-6 space-y-6 rounded-2xl border border-line bg-white p-6 md:p-8">
        <div className="flex flex-col gap-6 sm:flex-row">
          <div className="shrink-0">
            <span className="mb-1.5 block text-sm font-semibold text-navy-900">الصورة الشخصية</span>
            <label className="group relative block h-48 w-40 cursor-pointer overflow-hidden rounded-xl border-2 border-dashed border-line hover:border-teal">
              {f.photo_url ? (
                <img src={f.photo_url} alt="" className="h-full w-full object-cover object-top" />
              ) : (
                <span className="flex h-full flex-col items-center justify-center gap-2 bg-navy-50 p-3 text-center text-xs text-ink-soft">
                  {uploading ? "جارٍ الرفع…" : "اضغط لاختيار صورة"}
                </span>
              )}
              <input type="file" accept="image/*" className="sr-only" disabled={uploading} onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
            </label>
            {f.photo_url && (
              <button type="button" onClick={() => setF({ ...f, photo_url: "" })} className="mt-2 text-sm text-red-700 hover:underline">
                إزالة الصورة
              </button>
            )}
            <span className="mt-1 block max-w-40 text-xs text-ink-mute">الأفضل صورة طولية (طول أكبر من العرض).</span>
          </div>

          <div className="flex-1 space-y-5">
            <Field label="الاسم *">
              <input required value={f.name_ar} onChange={set("name_ar")} className="input" maxLength={120} placeholder="د. محمد أحمد" />
            </Field>
            <Field label="التخصص / المسمى">
              <input value={f.title_ar} onChange={set("title_ar")} className="input" maxLength={200} placeholder="استشاري جراحة العظام" />
            </Field>
          </div>
        </div>

        <Field label="نبذة مختصرة" hint="الخبرات والشهادات (اختياري).">
          <textarea value={f.bio_ar} onChange={set("bio_ar")} rows={4} maxLength={2000} className="input leading-relaxed" />
        </Field>

        <div className="border-t border-line pt-6">
          <button type="button" onClick={() => setShowEn((v) => !v)} className="text-sm font-semibold text-teal-700">
            {showEn ? "−" : "+"} النسخة الإنجليزية (اختياري)
          </button>
          {showEn ? (
            <div className="mt-4 space-y-4" dir="ltr">
              <Field label="Name (English)">
                <input value={f.name_en} onChange={set("name_en")} className="input font-en" maxLength={120} placeholder="Dr. Mohammad Ahmad" />
              </Field>
              <Field label="Specialty (English)">
                <input value={f.title_en} onChange={set("title_en")} className="input font-en" maxLength={200} placeholder="Consultant Orthopedic Surgeon" />
              </Field>
              <Field label="Bio (English)">
                <textarea value={f.bio_en} onChange={set("bio_en")} rows={4} maxLength={2000} className="input font-en leading-relaxed" />
              </Field>
            </div>
          ) : (
            <p className="mt-1 text-xs text-ink-mute">إن تُركت فارغة تظهر النسخة العربية في الموقع الإنجليزي.</p>
          )}
        </div>

        <label className="flex items-center gap-3 border-t border-line pt-6">
          <input type="checkbox" checked={f.published} onChange={(e) => setF({ ...f, published: e.target.checked })} className="h-5 w-5 accent-navy-800" />
          <span className="font-semibold text-navy-900">إظهار في الموقع</span>
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

"use client";

import { useCallback, useEffect, useState } from "react";
import type { Slide, SlideArea } from "@/lib/posts";
import { api } from "./AdminApp";
import { uploadImage } from "./image";

const COPY: Record<SlideArea, { title: string; hint: string; width: number }> = {
  hero: {
    title: "صور الواجهة الرئيسية",
    hint: "تتحرك هذه الصور تلقائياً خلف العنوان في أول الصفحة. إن لم تُضف صوراً تظهر الخلفية الافتراضية.",
    width: 1920,
  },
  about: {
    title: "صور قسم «من نحن»",
    hint: "تظهر هذه الصور في شريط متحرك أسفل نص «من نحن». إن لم تُضف صوراً لا يظهر الشريط.",
    width: 1200,
  },
};

/** إدارة صور قسم من الصفحة الرئيسية (الكاروسيل أو معرض «من نحن»): رفع، ترتيب، حذف. */
export default function SlidesManager({ area = "hero", onUnauthorized }: { area?: SlideArea; onUnauthorized: () => void }) {
  const copy = COPY[area];
  const base = `/api/admin/slides/?area=${area}`;
  const [slides, setSlides] = useState<Slide[] | null>(null);
  const [max, setMax] = useState(10);
  const [maxImageBytes, setMaxImageBytes] = useState(2 * 1024 * 1024);
  const [busy, setBusy] = useState("");
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
      const r = await api<{ slides: Slide[]; max: number; max_image_bytes: number }>(base);
      setSlides(r.slides);
      setMax(r.max);
      setMaxImageBytes(r.max_image_bytes);
    } catch (e) {
      fail(e);
    }
  }, [fail, base]);

  useEffect(() => {
    load();
  }, [load]);

  async function addFiles(files: FileList) {
    setError("");
    const room = max - (slides?.length ?? 0);
    const list = Array.from(files).slice(0, room);
    if (files.length > room) setError(`يمكن إضافة ${room} صور فقط (الحد الأقصى ${max}).`);
    for (let i = 0; i < list.length; i++) {
      setBusy(`جارٍ رفع الصورة ${i + 1} من ${list.length}…`);
      try {
        const url = await uploadImage(list[i], maxImageBytes, api, copy.width);
        await api(base, { method: "POST", body: JSON.stringify({ image_url: url }) });
      } catch (e) {
        fail(e);
        break;
      }
    }
    setBusy("");
    load();
  }

  async function move(index: number, dir: -1 | 1) {
    if (!slides) return;
    const next = [...slides];
    const [item] = next.splice(index, 1);
    next.splice(index + dir, 0, item);
    setSlides(next);
    try {
      await api(base, { method: "PUT", body: JSON.stringify({ order: next.map((s) => s.id) }) });
    } catch (e) {
      fail(e);
      load();
    }
  }

  async function remove(s: Slide) {
    if (!confirm("حذف هذه الصورة؟")) return;
    try {
      await api(`/api/admin/slides/${s.id}/`, { method: "DELETE" });
      load();
    } catch (e) {
      fail(e);
    }
  }

  const full = (slides?.length ?? 0) >= max;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">{copy.title}</h1>
          <p className="mt-1 text-sm text-ink-soft">{copy.hint}</p>
        </div>
        <label className={`btn-primary cursor-pointer !py-2.5 ${full || busy ? "pointer-events-none opacity-50" : ""}`}>
          + إضافة صور
          <input
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            disabled={full || Boolean(busy)}
            onChange={(e) => {
              if (e.target.files?.length) addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      </div>

      <p className="mt-4 text-sm text-ink-mute">
        {slides?.length ?? 0} / {max} صور · {area === "hero" ? "الأفضل صور عريضة (أفقية) بجودة جيدة" : "تُعرض كاملة بدون قص — أي أبعاد مناسبة"} · تُضغط تلقائياً قبل الرفع
      </p>

      {busy && <p className="mt-4 rounded-lg bg-teal-100 p-3 text-sm text-teal-700">{busy}</p>}
      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {!slides && !error && <p className="mt-10 text-center text-ink-mute">جارٍ التحميل…</p>}

      {slides && slides.length === 0 && (
        <p className="mt-6 rounded-2xl border border-dashed border-line bg-white p-10 text-center text-ink-soft">
          لا توجد صور بعد. اضغط «إضافة صور» لاختيار صورة أو أكثر.
        </p>
      )}

      <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {slides?.map((s, i) => (
          <li key={s.id} className="overflow-hidden rounded-2xl border border-line bg-white">
            <div className="relative aspect-[16/9] bg-navy-50">
              <img src={s.image_url} alt="" className={`h-full w-full ${area === "about" ? "object-contain" : "object-cover"}`} />
              <span className="absolute start-3 top-3 rounded-full bg-navy-900/80 px-2.5 py-0.5 font-en text-xs font-semibold text-white">
                {i + 1}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 p-3 text-sm">
              <div className="flex gap-1.5">
                <button
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="rounded-full border border-line px-3 py-1.5 text-navy-800 hover:bg-navy-50 disabled:opacity-30"
                  aria-label="تقديم"
                  title="تقديم"
                >
                  →
                </button>
                <button
                  onClick={() => move(i, 1)}
                  disabled={i === slides.length - 1}
                  className="rounded-full border border-line px-3 py-1.5 text-navy-800 hover:bg-navy-50 disabled:opacity-30"
                  aria-label="تأخير"
                  title="تأخير"
                >
                  ←
                </button>
              </div>
              <button onClick={() => remove(s)} className="rounded-full border border-red-200 px-3 py-1.5 text-red-700 hover:bg-red-50">
                حذف
              </button>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

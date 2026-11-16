"use client";

import { useEffect, useState } from "react";
import type { Slide } from "@/lib/posts";
import PulseStrip from "./PulseStrip";

const INTERVAL = 6000;

/**
 * خلفية متحركة للبانر الرئيسي: تتبدّل الصور بتلاشٍ ناعم كل 6 ثوانٍ.
 * تتوقف عند تفعيل "تقليل الحركة" في جهاز الزائر، وعند إخفاء التبويب.
 */
export default function HeroSlides({ slides, labels }: { slides: Slide[]; labels: { slide: string } }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (slides.length < 2 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      if (!document.hidden) setActive((i) => (i + 1) % slides.length);
    }, INTERVAL);
    return () => window.clearInterval(id);
  }, [slides.length, paused]);

  return (
    // الموبايل: شريط صور كامل العرض فوق النص، تظهر فيه الصورة كاملة بلا قص ولا تمديد.
    // الشاشات الكبيرة: خلفية تغطي البانر كاملاً خلف النص.
    <div className="relative aspect-[16/10] overflow-hidden bg-navy-900 lg:absolute lg:inset-0 lg:aspect-auto">
      <div aria-hidden className="absolute inset-0">
        {slides.map((s, i) => (
          <div
            key={s.id}
            className={`absolute inset-0 transition-opacity duration-[1400ms] ease-out ${i === active ? "opacity-100" : "opacity-0"}`}
          >
            {/* نسخة مموّهة تملأ الفراغ حول الصورة على الموبايل بدل الأشرطة الفارغة */}
            <img
              src={s.image_url}
              alt=""
              loading={i === 0 ? "eager" : "lazy"}
              className="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-xl lg:hidden"
            />
            <img
              src={s.image_url}
              alt=""
              loading={i === 0 ? "eager" : "lazy"}
              fetchPriority={i === 0 ? "high" : "low"}
              className={`relative h-full w-full object-contain transition-transform duration-[1400ms] ease-out lg:object-cover ${
                i === active ? "lg:scale-100" : "lg:scale-[1.04]"
              }`}
            />
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <div
          className="absolute inset-x-0 bottom-12 z-10 flex justify-center gap-2 lg:bottom-16"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`${labels.slide} ${i + 1}`}
              aria-current={i === active}
              className={`h-2.5 rounded-full shadow transition-all ${i === active ? "w-8 bg-teal" : "w-2.5 bg-white/60 hover:bg-white/80"}`}
            />
          ))}
        </div>
      )}
      <PulseStrip />
    </div>
  );
}

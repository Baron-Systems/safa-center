import type { Slide } from "@/lib/posts";

/**
 * شريط صور يتحرك بلا توقف أسفل نص «من نحن» (CSS فقط، بلا JavaScript).
 * الصور تُعرض كاملة بارتفاع ثابت وعرض حسب أبعادها — بلا قص.
 * يتوقف عند مرور الماوس، ويصبح شريطاً قابلاً للتمرير عند تفعيل «تقليل الحركة».
 */
export default function AboutGallery({ slides }: { slides: Slide[] }) {
  if (slides.length === 0) return null;
  // نكرر الصور حتى يمتلئ الشريط، ثم نضاعفه لحلقة متصلة بلا فجوة
  const base: Slide[] = [];
  while (base.length < 8) base.push(...slides);
  const seconds = base.length * 5;

  return (
    <div className="gallery-marquee mt-14 lg:mt-20" dir="ltr">
      <div className="gallery-track" style={{ animationDuration: `${seconds}s` }}>
        {[0, 1].map((copy) => (
          <ul key={copy} className="flex shrink-0 gap-4 pe-4 sm:gap-5 sm:pe-5" aria-hidden={copy === 1 || undefined}>
            {base.map((s, i) => (
              <li key={`${copy}-${i}`} className="shrink-0">
                <img
                  src={s.image_url}
                  alt={copy === 0 && i < slides.length ? (s.alt ?? "") : ""}
                  loading="lazy"
                  decoding="async"
                  className="h-52 w-auto max-w-none rounded-[18px] border border-line bg-navy-50 shadow-card sm:h-64 lg:h-72"
                />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}

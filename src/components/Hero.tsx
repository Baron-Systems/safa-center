import type { Dict } from "@/i18n";
import { contact } from "@/lib/site";
import { PhoneIcon, WhatsAppIcon } from "./Icons";
import { IconBadge, type BrandIconName } from "./BrandIcons";
import HeroSlides from "./HeroSlides";
import PulseStrip from "./PulseStrip";
import type { Slide } from "@/lib/posts";

const factIcons: BrandIconName[] = ["bed", "stethoscope", "shield"];

/** البانر الرئيسي — مبني على hero-banner من الهوية البصرية، بنص حي بدل الصورة. */
export default function Hero({ t, slides = [] }: { t: Dict; slides?: Slide[] }) {
  const hasSlides = slides.length > 0;
  return (
    <section id="top" aria-labelledby="hero-title" className="relative overflow-hidden bg-navy-900 text-white">
      <div className="relative">
      {/* الخلفية: صور الكاروسيل من لوحة التحكم إن وُجدت، وإلا صورة الهوية الافتراضية */}
      {hasSlides ? (
        <HeroSlides slides={slides} labels={{ slide: t.hero.slide }} />
      ) : (
        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-center opacity-70 blur-[1px] lg:start-[30%]"
          style={{ backgroundImage: "url(/brand/hero-photo.jpg)" }}
        />
      )}
      {/* تدرّج كحلي: معتم من جهة النص، شفاف من جهة الصورة (كما في البانر الأصلي).
          مع صور الكاروسيل: لا تدرّج فوق الصورة على الموبايل، وتدرّج خفيف على الشاشات الكبيرة. */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 ${
          hasSlides
            ? "hidden lg:block lg:bg-gradient-to-r rtl:lg:bg-gradient-to-l lg:from-navy-900/80 lg:from-[22%] lg:via-navy-900/35 lg:via-[48%] lg:to-transparent"
            : "bg-gradient-to-t from-navy-900 via-navy-900/90 to-navy-900/50 lg:bg-gradient-to-r rtl:lg:bg-gradient-to-l lg:from-navy-800 lg:from-[38%] lg:via-navy-900/85 lg:via-[62%] lg:to-navy-900/30"
        }`}
      />
      <div aria-hidden className={`pointer-events-none absolute inset-0 bg-wave-dark ${hasSlides ? "hidden opacity-25 lg:block" : ""}`} />
      <img
        src="/brand/mark-white.svg"
        alt=""
        aria-hidden
        className="pointer-events-none absolute -bottom-24 end-[4%] hidden h-[560px] w-auto opacity-[0.05] lg:block"
      />

      <div className={`container relative ${hasSlides ? "pb-14 pt-10" : "pb-16 pt-16"} md:pb-24 md:pt-24 lg:pb-28 lg:pt-28`}>
        <div className={`max-w-2xl ${hasSlides ? "lg:[text-shadow:0_2px_12px_rgba(11,37,80,.55)]" : ""}`}>
          <p className="inline-flex rounded-full border border-teal/50 bg-teal/10 px-4 py-1.5 text-sm font-medium text-teal-100">{t.hero.badge}</p>
          <h1 id="hero-title" className="mt-6 text-[2.4rem] font-extrabold leading-[1.25] tracking-tight text-balance sm:text-5xl lg:text-[3.6rem] lg:leading-[1.2]">
            {t.hero.title}
            <span className="block text-teal-300">{t.hero.titleAccent}</span>
          </h1>
          <span className="accent-bar mt-7" aria-hidden />

          <ul className="mt-7 flex flex-col gap-2.5 text-lg font-medium text-white/90 sm:flex-row sm:flex-wrap sm:gap-x-6">
            {t.hero.pillars.map((p) => (
              <li key={p} className="flex items-center gap-2.5">
                <span className="h-2 w-2 rounded-full bg-teal" aria-hidden />
                {p}
              </li>
            ))}
          </ul>

          <p className="mt-6 max-w-xl leading-relaxed text-white/70">{t.hero.lead}</p>

          <div className="mt-9 flex flex-wrap gap-3">
            <a href={contact.tel} className="btn-primary">
              <PhoneIcon className="h-[18px] w-[18px]" />
              {t.cta.call}
            </a>
            <a href={contact.whatsapp} target="_blank" rel="noopener" className="btn-outline-light">
              <WhatsAppIcon className="h-[18px] w-[18px]" />
              {t.cta.whatsapp}
            </a>
          </div>
          <p className="mt-4 text-sm text-white/60">
            {t.hero.bookingNote} ·{" "}
            <a href={contact.tel} dir="ltr" className="whitespace-nowrap font-en font-medium text-white hover:underline">
              {contact.phoneDisplay}
            </a>
          </p>
        </div>
      </div>

        {!hasSlides && <PulseStrip />}
      </div>

      <div className="relative border-t border-white/10 bg-white text-ink">
        <ul className="container grid divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0 rtl:sm:divide-x-reverse">
          {t.hero.facts.map((f, i) => (
            <li key={f.title} className="flex items-center gap-4 py-5 sm:px-6 sm:py-7 first:sm:ps-0">
              <IconBadge name={factIcons[i]} className="!h-12 !w-12" />
              <div>
                <p className="font-bold text-navy-900">{f.title}</p>
                <p className="mt-0.5 text-sm text-ink-soft">{f.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

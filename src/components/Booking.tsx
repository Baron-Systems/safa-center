import type { Dict } from "@/i18n";
import { contact } from "@/lib/site";
import { PhoneIcon, WhatsAppIcon } from "./Icons";
import { SectionHead } from "./ui";

export default function Booking({ t }: { t: Dict }) {
  return (
    <section id="booking" aria-labelledby="booking-title" className="section bg-navy-50">
      <div className="container">
        <SectionHead id="booking-title" index="07" label={t.booking.label} title={t.booking.title} />
        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:gap-16">
          <ol className="space-y-0">
            {t.booking.steps.map((s, i) => (
              <li key={s.title} className="relative flex gap-5 pb-8 last:pb-0">
                {i < t.booking.steps.length - 1 && (
                  <span className="absolute start-[19px] top-11 bottom-1 w-px bg-navy-800/20" aria-hidden />
                )}
                <span className="font-en flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-navy-800/30 bg-white text-sm font-semibold text-navy-800">
                  {i + 1}
                </span>
                <div className="pt-1.5">
                  <h3 className="font-bold text-navy-900">{s.title}</h3>
                  <p className="mt-1 leading-relaxed text-ink-soft">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="rounded-2xl border border-line bg-white p-8 md:p-10">
            <p className="text-sm font-medium text-teal-700">{t.booking.numberLabel}</p>
            <a
              href={contact.tel}
              dir="ltr"
              className="mt-3 block text-start font-en text-3xl font-semibold tracking-tight text-navy-900 hover:text-navy-700 md:text-4xl rtl:text-end"
            >
              {contact.phoneDisplay}
            </a>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <a href={contact.tel} className="btn-primary">
                <PhoneIcon className="h-[18px] w-[18px]" />
                {t.cta.call}
              </a>
              <a href={contact.whatsapp} target="_blank" rel="noopener" className="btn-outline">
                <WhatsAppIcon className="h-[18px] w-[18px]" />
                {t.cta.whatsapp}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

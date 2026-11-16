import type { Dict } from "@/i18n";
import { SectionHead } from "./ui";
import { BrandIcon, IconBadge, type BrandIconName } from "./BrandIcons";

const itemIcons: BrandIconName[] = ["scalpel", "stethoscope"];
const noteIcons: BrandIconName[] = ["shield", "calendar", "location"];

export default function Services({ t }: { t: Dict }) {
  return (
    <section id="services" aria-labelledby="services-title" className="section bg-navy-50 bg-wave-light">
      <div className="container">
        <SectionHead id="services-title" index="02" label={t.services.label} title={t.services.title} />

        <div className="grid gap-5 md:grid-cols-2">
          {t.services.items.map((s, i) => (
            <article key={s.title} className="relative overflow-hidden rounded-[18px] border border-line bg-white p-8 shadow-card md:p-10">
              <span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-accent-gradient" />
              <IconBadge name={itemIcons[i]} />
              <h3 className="relative mt-6 text-2xl font-extrabold text-navy-800">{s.title}</h3>
              <p className="relative mt-4 max-w-md leading-relaxed text-ink-soft">{s.text}</p>
            </article>
          ))}
        </div>

        <dl className="mt-5 grid gap-px overflow-hidden rounded-[18px] border border-line bg-line shadow-card md:grid-cols-3">
          {t.services.notes.map((n, i) => (
            <div key={n.title} className="bg-white p-6 md:p-7">
              <dt className="flex items-center gap-2 text-sm font-bold text-teal-700">
                <BrandIcon name={noteIcons[i]} className="h-5 w-5" />
                {n.title}
              </dt>
              <dd className="mt-2 leading-relaxed text-ink">{n.text}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

import type { Dict } from "@/i18n";
import { SectionHead } from "./ui";
import { IconBadge, type BrandIconName } from "./BrandIcons";

const icons: BrandIconName[] = ["clock", "doctor", "scalpel", "tech", "heart-care"];

export default function Features({ t }: { t: Dict }) {
  return (
    <section id="why" aria-labelledby="why-title" className="section">
      <div className="container">
        <SectionHead id="why-title" index="03" label={t.why.label} title={t.why.title} />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {t.why.items.map((f, i) => (
            <li
              key={f.title}
              className="group rounded-[18px] border border-line bg-white p-6 transition-shadow hover:shadow-card"
            >
              <div className="flex items-center justify-between">
                <IconBadge name={icons[i]} className="transition-colors group-hover:bg-teal group-hover:text-white" />
                <span className="font-en text-sm tabular-nums text-teal-700/60">{String(i + 1).padStart(2, "0")}</span>
              </div>
              <h3 className="mt-5 text-lg font-extrabold text-navy-800">{f.title}</h3>
              <p className="mt-2 leading-relaxed text-ink-soft">{f.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

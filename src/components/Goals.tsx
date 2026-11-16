import type { Dict } from "@/i18n";
import { SectionHead } from "./ui";

export default function Goals({ t }: { t: Dict }) {
  return (
    <section id="goals" aria-labelledby="goals-title" className="section">
      <div className="container">
        <SectionHead id="goals-title" index="06" label={t.goals.label} title={t.goals.title} />
        <ol className="grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
          {t.goals.items.map((g, i) => (
            <li key={g.title} className="flex gap-5 border-t border-line py-7">
              <span className="font-en text-2xl font-semibold tabular-nums leading-none text-teal" aria-hidden>
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="font-bold text-navy-900">{g.title}</h3>
                <p className="mt-2 leading-relaxed text-ink-soft">{g.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

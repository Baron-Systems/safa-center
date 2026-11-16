import type { Dict } from "@/i18n";

export default function VisionMission({ t }: { t: Dict }) {
  const blocks = [
    { label: t.vision.visionLabel, text: t.vision.vision },
    { label: t.vision.missionLabel, text: t.vision.mission },
  ];
  return (
    <section aria-label={`${t.vision.visionLabel} · ${t.vision.missionLabel}`} className="section relative overflow-hidden bg-brand-gradient text-white">
      <div aria-hidden className="absolute inset-0 bg-wave-dark" />
      <img src="/brand/mark-white.svg" alt="" aria-hidden className="pointer-events-none absolute -bottom-20 -start-10 h-[460px] w-auto opacity-[0.06]" />
      <div className="container relative grid gap-14 md:grid-cols-2 md:gap-0">
        {blocks.map((b, i) => (
          <div key={b.label} className={i === 1 ? "md:border-s md:border-white/15 md:ps-14" : "md:pe-14"}>
            <p className="flex items-center gap-3 text-sm font-medium text-teal-300">
              <span className="font-en">0{i + 4}</span>
              <span className="h-px w-10 bg-white/30" />
            </p>
            <h2 className="mt-4 text-3xl font-extrabold md:text-4xl">{b.label}</h2>
            <span className="accent-bar mt-5" aria-hidden />
            <p className="mt-6 text-lg leading-[2] text-white/85">{b.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

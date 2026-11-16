import type { Dict } from "@/i18n";
import type { Slide } from "@/lib/posts";
import { SectionHead } from "./ui";
import AboutGallery from "./AboutGallery";

export default function About({ t, gallery = [] }: { t: Dict; gallery?: Slide[] }) {
  return (
    <section id="about" aria-labelledby="about-title" className="section">
      <div className="container grid gap-8 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
        <SectionHead id="about-title" index="01" label={t.about.label} title={t.about.title} />
        <p className="text-lg leading-[2] text-ink-soft lg:pt-10 lg:text-xl lg:leading-[2]">{t.about.body}</p>
      </div>
      <AboutGallery slides={gallery} />
    </section>
  );
}

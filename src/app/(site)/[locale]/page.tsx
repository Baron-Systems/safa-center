import { getDict } from "@/i18n";
import type { Locale } from "@/lib/site";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Services from "@/components/Services";
import Features from "@/components/Features";
import VisionMission from "@/components/VisionMission";
import Goals from "@/components/Goals";
import Booking from "@/components/Booking";
import NewsSection from "@/components/NewsSection";
import { listPublished, listSlides } from "@/lib/db";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import MobileBookingBar from "@/components/MobileBookingBar";

export const dynamic = "force-dynamic";

export default async function Home({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = getDict(locale);
  return (
    <>
      <Header t={t} />
      <main>
        <Hero t={t} slides={listSlides()} />
        <About t={t} gallery={listSlides("about")} />
        <Services t={t} />
        <Features t={t} />
        <VisionMission t={t} />
        <Goals t={t} />
        <NewsSection t={t} locale={locale} posts={listPublished(3)} />
        <Booking t={t} />
        <Contact t={t} />
      </main>
      <Footer t={t} />
      <MobileBookingBar t={t} />
    </>
  );
}

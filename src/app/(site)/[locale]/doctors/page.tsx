import type { Metadata } from "next";
import { getDict } from "@/i18n";
import { SITE_URL, contact, type Locale } from "@/lib/site";
import { listDoctors } from "@/lib/db";
import { localizeDoctor } from "@/lib/posts";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileBookingBar from "@/components/MobileBookingBar";
import { PageHeader } from "@/components/ui";
import { PhoneIcon, WhatsAppIcon } from "@/components/Icons";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = getDict(locale);
  return {
    title: t.doctors.pageTitle,
    description: t.doctors.description,
    alternates: {
      canonical: `${SITE_URL}/${locale}/doctors/`,
      languages: { ar: `${SITE_URL}/ar/doctors/`, en: `${SITE_URL}/en/doctors/` },
    },
  };
}

export default async function DoctorsPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = getDict(locale);
  const doctors = listDoctors();
  return (
    <>
      <Header t={t} />
      <PageHeader title={t.doctors.label} crumbs={[{ label: t.news.home, href: `/${locale}/` }, { label: t.doctors.label }]} />
      <main className="section min-h-[50vh] bg-navy-50 !pt-14">
        <div className="container">
          <div className="mb-12 max-w-3xl">
            <h2 className="text-2xl font-extrabold text-navy-800 md:text-3xl">{t.doctors.title}</h2>
            <p className="mt-3 text-lg leading-relaxed text-ink-soft">{t.doctors.intro}</p>
          </div>

          {doctors.length === 0 ? (
            <p className="rounded-[18px] border border-dashed border-line bg-white py-16 text-center text-ink-soft">{t.doctors.empty}</p>
          ) : (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {doctors.map((d) => {
                const l = localizeDoctor(d, locale);
                return (
                  <li key={d.id} className="group flex flex-col overflow-hidden rounded-[18px] border border-line bg-white shadow-card">
                    <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-b from-teal-100 to-navy-50">
                      {d.photo_url ? (
                        <img
                          src={d.photo_url}
                          alt={l.name}
                          loading="lazy"
                          className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <img src="/brand/mark-color.svg" alt="" className="h-28 w-auto opacity-25" />
                        </div>
                      )}
                      <span aria-hidden className="absolute inset-x-0 bottom-0 h-1 bg-accent-gradient" />
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="text-lg font-bold text-navy-900">{l.name}</h3>
                      {l.title && <p className="mt-1 text-sm font-medium text-teal-700">{l.title}</p>}
                      {l.bio && <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-soft">{l.bio}</p>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-14 flex flex-col items-center gap-4 rounded-[18px] bg-navy-900 bg-wave-dark p-8 text-center text-white md:flex-row md:justify-between md:text-start">
            <p className="text-xl font-bold">{t.doctors.cta}</p>
            <div className="flex flex-wrap justify-center gap-3">
              <a href={contact.tel} className="btn-primary">
                <PhoneIcon className="h-[18px] w-[18px]" />
                {t.cta.call}
              </a>
              <a href={contact.whatsapp} target="_blank" rel="noopener" className="btn-outline-light">
                <WhatsAppIcon className="h-[18px] w-[18px]" />
                {t.cta.whatsapp}
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer t={t} />
      <MobileBookingBar t={t} />
    </>
  );
}

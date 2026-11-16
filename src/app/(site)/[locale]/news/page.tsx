import type { Metadata } from "next";
import { getDict } from "@/i18n";
import { SITE_URL, type Locale } from "@/lib/site";
import { listPublished } from "@/lib/db";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileBookingBar from "@/components/MobileBookingBar";
import PostCard from "@/components/PostCard";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = getDict(locale);
  return {
    title: t.news.pageTitle,
    alternates: {
      canonical: `${SITE_URL}/${locale}/news/`,
      languages: { ar: `${SITE_URL}/ar/news/`, en: `${SITE_URL}/en/news/` },
    },
  };
}

export default async function NewsPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = getDict(locale);
  const posts = listPublished(100);
  return (
    <>
      <Header t={t} />
      <PageHeader title={t.news.label} crumbs={[{ label: t.news.home, href: `/${locale}/` }, { label: t.news.label }]} />
      <main className="section min-h-[50vh] bg-navy-50 !pt-14">
        <div className="container">
          {posts.length === 0 ? (
            <p className="py-16 text-center text-ink-soft">{t.news.empty}</p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((p) => (
                <PostCard key={p.id} post={p} t={t} locale={locale} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer t={t} />
      <MobileBookingBar t={t} />
    </>
  );
}

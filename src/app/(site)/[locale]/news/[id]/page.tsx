import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDict } from "@/i18n";
import { SITE_URL, type Locale } from "@/lib/site";
import { getPublished } from "@/lib/db";
import { formatDate, localize } from "@/lib/posts";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileBookingBar from "@/components/MobileBookingBar";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

type Props = { params: Promise<{ locale: Locale; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const post = getPublished(id);
  if (!post) return {};
  const t = getDict(locale);
  const { title, body } = localize(post, locale);
  const description = body.replace(/\s+/g, " ").slice(0, 160);
  return {
    title: `${title} | ${t.name}`,
    description,
    alternates: {
      canonical: `${SITE_URL}/${locale}/news/${id}/`,
      languages: { ar: `${SITE_URL}/ar/news/${id}/`, en: `${SITE_URL}/en/news/${id}/` },
    },
    openGraph: { type: "article", title, description, images: [post.cover_url ?? "/og.jpg"] },
  };
}

export default async function PostPage({ params }: Props) {
  const { locale, id } = await params;
  const post = getPublished(id);
  if (!post) notFound();
  const t = getDict(locale);
  const { title, body } = localize(post, locale);
  const isEvent = post.kind === "event";

  return (
    <>
      <Header t={t} />
      <PageHeader
        title={isEvent ? t.news.event : t.news.news}
        crumbs={[{ label: t.news.home, href: `/${locale}/` }, { label: t.news.label, href: `/${locale}/news/` }]}
      />
      <main className="section min-h-[50vh] !pt-12">
        <article className="container max-w-3xl">
          <a href={`/${locale}/news/`} className="text-sm font-semibold text-teal-700 hover:text-navy-800">
            {locale === "ar" ? "→" : "←"} {t.news.back}
          </a>
          <p className="mt-6 flex items-center gap-2 text-sm">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${isEvent ? "bg-teal-100 text-teal-700" : "bg-navy-100 text-navy-800"}`}>
              {isEvent ? t.news.event : t.news.news}
            </span>
            <time dateTime={post.created_at} className="text-ink-mute">
              {formatDate(post.created_at, locale)}
            </time>
          </p>
          <h1 className="mt-4 text-3xl font-bold leading-snug text-navy-900 md:text-4xl">{title}</h1>

          {isEvent && (post.event_date || post.location) && (
            <dl className="mt-6 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
              {post.event_date && (
                <div className="bg-navy-50 p-5">
                  <dt className="text-sm font-semibold text-teal-700">{t.news.eventDate}</dt>
                  <dd className="mt-1 text-navy-900">{formatDate(post.event_date, locale, true)}</dd>
                </div>
              )}
              {post.location && (
                <div className="bg-navy-50 p-5">
                  <dt className="text-sm font-semibold text-teal-700">{t.news.location}</dt>
                  <dd className="mt-1 text-navy-900">{post.location}</dd>
                </div>
              )}
            </dl>
          )}

          {post.cover_url && <img src={post.cover_url} alt="" className="mt-8 w-full rounded-2xl border border-line object-cover" />}
          <div className="mt-8 whitespace-pre-line text-lg leading-loose text-ink">{body}</div>
        </article>
      </main>
      <Footer t={t} />
      <MobileBookingBar t={t} />
    </>
  );
}

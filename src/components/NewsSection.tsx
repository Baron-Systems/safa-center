import type { Dict } from "@/i18n";
import type { Locale } from "@/lib/site";
import type { Post } from "@/lib/posts";
import { SectionHead } from "./ui";
import PostCard from "./PostCard";

/** قسم "آخر الأخبار" في الصفحة الرئيسية — لا يظهر إن لم توجد أخبار منشورة. */
export default function NewsSection({ t, locale, posts }: { t: Dict; locale: Locale; posts: Post[] }) {
  if (posts.length === 0) return null;
  return (
    <section id="news" aria-labelledby="news-title" className="section">
      <div className="container">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHead id="news-title" index="—" label={t.news.label} title={t.news.title} />
          <a href={`/${locale}/news/`} className="btn-outline mb-12 md:mb-16">
            {t.news.all}
          </a>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} t={t} locale={locale} />
          ))}
        </div>
      </div>
    </section>
  );
}

import type { Dict } from "@/i18n";
import type { Locale } from "@/lib/site";
import { formatDate, localize, type Post } from "@/lib/posts";

export default function PostCard({ post, t, locale }: { post: Post; t: Dict; locale: Locale }) {
  const { title, body } = localize(post, locale);
  const href = `/${locale}/news/${post.id}/`;
  const isEvent = post.kind === "event";
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition-shadow hover:shadow-lg hover:shadow-navy-900/5">
      <a href={href} className="block aspect-[16/10] overflow-hidden bg-navy-50" tabIndex={-1} aria-hidden>
        {post.cover_url ? (
          <img
            src={post.cover_url}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <img src="/brand/mark-color.svg" alt="" className="h-20 w-auto opacity-25" />
          </div>
        )}
      </a>
      <div className="flex flex-1 flex-col p-6">
        <p className="flex flex-wrap items-center gap-2 text-sm">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              isEvent ? "bg-teal-100 text-teal-700" : "bg-navy-100 text-navy-800"
            }`}
          >
            {isEvent ? t.news.event : t.news.news}
          </span>
          <time dateTime={post.event_date ?? post.created_at} className="text-ink-mute">
            {formatDate(isEvent && post.event_date ? post.event_date : post.created_at, locale)}
          </time>
        </p>
        <h3 className="mt-3 text-lg font-bold leading-snug text-navy-900">
          <a href={href} className="hover:text-navy-700">
            {title}
          </a>
        </h3>
        <p className="mt-2 line-clamp-3 leading-relaxed text-ink-soft">{body}</p>
        <a href={href} className="mt-auto pt-4 text-sm font-semibold text-teal-700 hover:text-navy-800">
          {t.news.more} {locale === "ar" ? "←" : "→"}
        </a>
      </div>
    </article>
  );
}

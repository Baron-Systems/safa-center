import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { listPublished } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const languages = { ar: `${SITE_URL}/ar/`, en: `${SITE_URL}/en/` };
  const pages = (["ar", "en"] as const).map((l) => ({
    url: `${SITE_URL}/${l}/`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: l === "ar" ? 1 : 0.9,
    alternates: { languages },
  }));
  const news = (["ar", "en"] as const).map((l) => ({
    url: `${SITE_URL}/${l}/news/`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));
  const posts = listPublished(1000).flatMap((p) =>
    (["ar", "en"] as const).map((l) => ({
      url: `${SITE_URL}/${l}/news/${p.id}/`,
      lastModified: new Date(p.updated_at),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  );
  const doctors = (["ar", "en"] as const).map((l) => ({
    url: `${SITE_URL}/${l}/doctors/`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));
  return [...pages, ...doctors, ...news, ...posts];
}

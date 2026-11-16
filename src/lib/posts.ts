// أنواع ودوال مشتركة بين السيرفر والمتصفح (لا تستورد أي شيء خاص بالسيرفر هنا).
import type { Locale } from "./site";

export type PostKind = "news" | "event";

export type Post = {
  id: string;
  kind: PostKind;
  title_ar: string;
  title_en: string | null;
  body_ar: string;
  body_en: string | null;
  cover_url: string | null;
  event_date: string | null;
  location: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
};

/** مكان عرض الصورة: hero = كاروسيل الواجهة، about = معرض قسم «من نحن» */
export type SlideArea = "hero" | "about";
export const SLIDE_AREAS: SlideArea[] = ["hero", "about"];

export type Slide = {
  id: string;
  area: SlideArea;
  image_url: string;
  alt: string | null;
  sort_order: number;
  created_at: string;
};

/** عضو في الطاقم الطبي */
export type Doctor = {
  id: string;
  name_ar: string;
  name_en: string | null;
  title_ar: string | null; // التخصص / المسمى
  title_en: string | null;
  bio_ar: string | null;
  bio_en: string | null;
  photo_url: string | null;
  sort_order: number;
  published: boolean;
  created_at: string;
  updated_at: string;
};

export type DoctorInput = Omit<Doctor, "id" | "sort_order" | "created_at" | "updated_at">;

/** الاسم والتخصص والنبذة حسب اللغة، مع الرجوع للعربية. */
export function localizeDoctor(d: Doctor, locale: Locale) {
  const en = locale === "en";
  return {
    name: (en && d.name_en?.trim()) || d.name_ar,
    title: (en && d.title_en?.trim()) || d.title_ar || "",
    bio: (en && d.bio_en?.trim()) || d.bio_ar || "",
  };
}

export type PostInput = Omit<Post, "id" | "created_at" | "updated_at">;

export type Usage = {
  media_bytes: number;
  media_quota: number;
  db_bytes: number;
  posts: number;
  posts_max: number;
  max_image_bytes: number;
};

/** يختار العنوان والنص حسب اللغة، مع الرجوع للعربية إن لم تتوفر الترجمة. */
export function localize(post: Post, locale: Locale) {
  const en = locale === "en";
  return {
    title: (en && post.title_en?.trim()) || post.title_ar,
    body: (en && post.body_en?.trim()) || post.body_ar,
  };
}

export function formatDate(iso: string, locale: Locale, withTime = false) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-PS" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Hebron",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
  }).format(new Date(iso));
}

export function formatBytes(n: number) {
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

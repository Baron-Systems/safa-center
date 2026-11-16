// عدّل SITE_URL إلى نطاق الموقع النهائي قبل النشر (يُستخدم في SEO و sitemap).
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://alsafa-surgeries.com").replace(/\/$/, "");

export const locales = ["ar", "en"] as const;
export type Locale = (typeof locales)[number];

export const contact = {
  phoneE164: "+972569992333",
  phoneDisplay: "+972 56 999 2333",
  tel: "tel:+972569992333",
  whatsapp: "https://wa.me/972569992333",
  email: "alsafaspecializedsurgical@gmail.com",
  facebook: "https://www.facebook.com/share/1EezW57UYU/",
  instagram: "https://www.instagram.com/al_safa.specialized.surgeries",
  instagramHandle: "@al_safa.specialized.surgeries",
  // إحداثيات المركز الدقيقة (من رابط Google Maps الرسمي)
  mapsQuery: "31.544286,35.098403",
  mapsShare: "https://maps.app.goo.gl/ME67oBMA2VaojWzm6",
};

export const mapsLink = contact.mapsShare;
export const mapsEmbed = `https://www.google.com/maps?q=${encodeURIComponent(contact.mapsQuery)}&z=17&output=embed`;

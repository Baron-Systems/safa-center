import type { Metadata, Viewport } from "next";
import { Tajawal, Poppins } from "next/font/google";
import { notFound } from "next/navigation";
import "../../globals.css";
import { getDict } from "@/i18n";
import { SITE_URL, locales, type Locale } from "@/lib/site";
import JsonLd from "@/components/JsonLd";

const fontAr = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-ar",
  display: "swap",
});
const fontEn = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-en",
  display: "swap",
});

export const dynamicParams = false;
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = { themeColor: "#123B7A", width: "device-width", initialScale: 1 };

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = getDict(locale);
  const url = `${SITE_URL}/${locale}/`;
  return {
    metadataBase: new URL(SITE_URL),
    title: t.meta.title,
    description: t.meta.description,
    applicationName: t.name,
    alternates: {
      canonical: url,
      languages: { ar: `${SITE_URL}/ar/`, en: `${SITE_URL}/en/`, "x-default": `${SITE_URL}/ar/` },
    },
    openGraph: {
      type: "website",
      url,
      siteName: t.name,
      title: t.meta.title,
      description: t.meta.description,
      locale: locale === "ar" ? "ar_PS" : "en_US",
      images: [{ url: "/og.jpg", width: 1200, height: 630, alt: t.name }],
    },
    twitter: { card: "summary_large_image", title: t.meta.title, description: t.meta.description, images: ["/og.jpg"] },
    icons: {
      icon: [{ url: "/favicon.ico", sizes: "any" }, { url: "/favicon.svg", type: "image/svg+xml" }],
      apple: "/apple-touch-icon.png",
    },
    manifest: "/site.webmanifest",
    formatDetection: { telephone: true },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) notFound();
  const dir = locale === "ar" ? "rtl" : "ltr";
  return (
    <html lang={locale} dir={dir} className={`${fontAr.variable} ${fontEn.variable}`}>
      <body className={locale === "en" ? "font-en" : "font-sans"}>
        <JsonLd locale={locale as Locale} />
        {children}
      </body>
    </html>
  );
}

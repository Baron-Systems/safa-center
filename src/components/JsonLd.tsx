import { getDict } from "@/i18n";
import { SITE_URL, contact, type Locale } from "@/lib/site";

export default function JsonLd({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const data = {
    "@context": "https://schema.org",
    "@type": "MedicalClinic",
    "@id": `${SITE_URL}/#organization`,
    name: t.name,
    alternateName: t.nameAlt,
    description: t.meta.description,
    url: `${SITE_URL}/${locale}/`,
    logo: `${SITE_URL}/brand/logo-badge.png`,
    image: `${SITE_URL}/og.jpg`,
    telephone: contact.phoneE164,
    email: contact.email,
    medicalSpecialty: "Surgical",
    address: {
      "@type": "PostalAddress",
      streetAddress: t.contact.address.slice(1).join("، "),
      addressLocality: locale === "ar" ? "الخليل" : "Hebron",
      addressCountry: "PS",
    },
    geo: { "@type": "GeoCoordinates", latitude: 31.544286, longitude: 35.098403 },
    hasMap: contact.mapsShare,
    paymentAccepted: "Nat Health insurance",
    sameAs: [contact.facebook, contact.instagram],
    inLanguage: locale,
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

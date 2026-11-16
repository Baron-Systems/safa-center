import type { Metadata, Viewport } from "next";
import { Tajawal, Poppins } from "next/font/google";
import "../../globals.css";

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

export const metadata: Metadata = {
  title: "لوحة التحكم | الصفا للجراحات التخصصية",
  robots: { index: false, follow: false },
  icons: { icon: [{ url: "/favicon.ico", sizes: "any" }, { url: "/favicon.svg", type: "image/svg+xml" }] },
};

export const viewport: Viewport = { themeColor: "#123B7A", width: "device-width", initialScale: 1 };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${fontAr.variable} ${fontEn.variable}`}>
      <body className="min-h-screen bg-navy-50 font-sans">{children}</body>
    </html>
  );
}

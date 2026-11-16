import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "الصفا للجراحات التخصصية",
  robots: { index: false, follow: true },
};

export default function RedirectLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}

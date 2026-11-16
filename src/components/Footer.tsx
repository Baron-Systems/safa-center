import type { Dict } from "@/i18n";
import { contact } from "@/lib/site";
import { FacebookIcon, InstagramIcon } from "./Icons";

export default function Footer({ t }: { t: Dict }) {
  return (
    <footer className="relative border-t-4 border-teal bg-navy-900 bg-wave-dark pb-24 text-white/70 md:pb-0">
      <div className="container flex flex-col gap-6 py-10 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <img src="/brand/mark-white.svg" alt="" width={25} height={40} loading="lazy" className="h-10 w-auto" />
          <div className="leading-tight">
            <p className="font-semibold text-white">{t.name}</p>
            <p className="font-en text-xs text-teal-300">{t.nameAlt}</p>
          </div>
        </div>
        <div className="flex items-center gap-5 text-sm">
          <span>
            © {new Date().getFullYear()} {t.name}. {t.footer.rights}
          </span>
          <a href={contact.facebook} target="_blank" rel="noopener" aria-label={t.contact.facebook} className="hover:text-white">
            <FacebookIcon />
          </a>
          <a href={contact.instagram} target="_blank" rel="noopener" aria-label={t.contact.instagram} className="hover:text-white">
            <InstagramIcon />
          </a>
        </div>
      </div>
    </footer>
  );
}

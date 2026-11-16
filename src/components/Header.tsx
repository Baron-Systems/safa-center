"use client";

import { useEffect, useState } from "react";
import type { Dict } from "@/i18n";
import { contact } from "@/lib/site";
import { CloseIcon, MenuIcon, PhoneIcon } from "./Icons";

export default function Header({ t }: { t: Dict }) {
  const [open, setOpen] = useState(false);
  const links = [
    [`${t.home}#about`, t.nav.about],
    [`${t.home}#services`, t.nav.services],
    [`${t.home}doctors/`, t.nav.doctors],
    [`${t.home}#why`, t.nav.why],
    [`${t.home}news/`, t.nav.news],
    [`${t.home}#contact`, t.nav.contact],
  ] as const;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="container flex h-[72px] items-center justify-between gap-6">
        <a href={t.home} className="flex items-center gap-3" aria-label={t.name}>
          <img src="/brand/mark-color.svg" alt="" width={27} height={44} className="h-11 w-auto" />
          <span className="leading-tight">
            <span className="block text-sm font-extrabold text-navy-800 sm:text-base">{t.name}</span>
            <span className="block font-en text-[11px] font-medium tracking-wide text-teal-700" lang={t.nameAlt.match(/[a-z]/i) ? "en" : "ar"}>
              {t.nameAlt}
            </span>
          </span>
        </a>

        <nav aria-label={t.nav.menu} className="hidden lg:block">
          <ul className="flex items-center gap-7 text-[15px] font-medium text-ink-soft">
            {links.map(([href, label]) => (
              <li key={href}>
                <a href={href} className="transition-colors hover:text-navy-800">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={t.langSwitch.href}
            hrefLang={t.langSwitch.href.includes("en") ? "en" : "ar"}
            className="rounded-full px-3 py-2 text-sm font-medium text-navy-800 transition-colors hover:bg-navy-50"
          >
            {t.langSwitch.label}
          </a>
          <a href={contact.tel} className="btn-primary hidden !px-5 !py-2.5 sm:inline-flex">
            <PhoneIcon className="h-4 w-4" />
            {t.cta.call}
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="rounded-full p-2 text-navy-800 hover:bg-navy-50 lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? t.nav.close : t.nav.menu}
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label={t.nav.menu} className="border-t border-line bg-white lg:hidden">
          <ul className="container py-3">
            {links.map(([href, label]) => (
              <li key={href}>
                <a
                  href={href}
                  onClick={() => setOpen(false)}
                  className="block border-b border-line/70 py-3.5 text-base text-navy-900 last:border-0"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}

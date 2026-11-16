// أيقونات الهوية البصرية (05-Icons) — تأخذ لون النص الحالي (currentColor).

const paths = {
  "bed": <><path d="M5 14 v24 M5 30 h38 v8 M43 30 v-6 a6 6 0 0 0 -6 -6 h-16 v12"/><circle cx="13" cy="23" r="4"/></>,
  "calendar": <><rect x="7" y="10" width="34" height="31" rx="4"/><path d="M7 19 h34 M16 6 v8 M32 6 v8"/><path d="M18 30 l4 4 l8 -8"/></>,
  "clock": <><circle cx="24" cy="24" r="18"/><path d="M24 13 v11 l7 5"/></>,
  "doctor": <><circle cx="24" cy="15" r="8"/><path d="M8 42 c0-9 7-15 16-15 s16 6 16 15"/><path d="M24 31 v6 M21 34 h6"/></>,
  "heart-care": <><path d="M24 41 C10 31 5 24 5 17 a9 9 0 0 1 19 -4 a9 9 0 0 1 19 4 c0 7 -5 14 -19 24 Z"/><path d="M12 24 h7 l3 -5 l4 9 l3 -4 h7"/></>,
  "location": <><path d="M24 43 C24 43 38 30 38 19 a14 14 0 0 0 -28 0 C10 30 24 43 24 43 Z"/><circle cx="24" cy="19" r="5"/></>,
  "lock": <><rect x="10" y="21" width="28" height="21" rx="4"/><path d="M16 21 v-6 a8 8 0 0 1 16 0 v6"/><circle cx="24" cy="31" r="2.5"/></>,
  "phone": <><path d="M14 6 h-4 a4 4 0 0 0 -4 4 c0 18 14 32 32 32 a4 4 0 0 0 4 -4 v-4 l-8 -4 l-4 4 c-6 -2 -12 -8 -14 -14 l4 -4 Z"/></>,
  "scalpel": <><path d="M8 38 L26 20"/><path d="M26 20 C30 14 36 10 42 8 C40 15 35 21 29 23 Z"/><path d="M13 33 l3 3 M17 29 l3 3"/></>,
  "shield": <><path d="M24 5 L39 11 V22 C39 32 32 39 24 43 C16 39 9 32 9 22 V11 Z"/><path d="M17 24 l5 5 l9 -10"/></>,
  "stethoscope": <><path d="M12 6 v12 a8 8 0 0 0 16 0 V6"/><path d="M9 6 h6 M25 6 h6"/><path d="M20 26 v6 a8 8 0 0 0 16 0 v-4"/><circle cx="36" cy="24" r="4"/></>,
  "tech": <><rect x="6" y="9" width="36" height="24" rx="3"/><path d="M18 40 h12 M24 33 v7"/><path d="M11 22 h7 l3 -6 l5 12 l3 -6 h8"/></>,
} as const;

export type BrandIconName = keyof typeof paths;

export function BrandIcon({ name, className = "h-6 w-6" }: { name: BrandIconName; className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
      {paths[name]}
    </svg>
  );
}

/** الأيقونة داخل دائرة فيروزية فاتحة — كما في دليل الهوية */
export function IconBadge({ name, className = "" }: { name: BrandIconName; className?: string }) {
  return (
    <span className={`inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-teal-100 text-navy-800 ${className}`}>
      <BrandIcon name={name} className="h-7 w-7" />
    </span>
  );
}

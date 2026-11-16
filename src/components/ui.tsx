// عناصر مشتركة: عنوان القسم وحلقات الهوية المستوحاة من الحلقة المزدوجة في الشعار.

export function SectionHead({
  index,
  label,
  title,
  invert = false,
  id,
}: {
  index: string;
  label: string;
  title: string;
  invert?: boolean;
  id?: string;
}) {
  return (
    <header className="mb-12 md:mb-16">
      <p className={`flex items-center gap-3 text-sm font-medium ${invert ? "text-teal-100" : "text-teal-700"}`}>
        <span className="font-en tabular-nums">{index}</span>
        <span className={`h-px w-10 ${invert ? "bg-white/30" : "bg-teal/50"}`} />
        <span>{label}</span>
      </p>
      <h2
        id={id}
        className={`mt-4 max-w-2xl text-3xl font-extrabold leading-snug tracking-tight md:text-[2.5rem] md:leading-tight ${
          invert ? "text-white" : "text-navy-800"
        }`}
      >
        {title}
      </h2>
      <span className="accent-bar mt-5" aria-hidden />
    </header>
  );
}

/** حلقتان رفيعتان متحدتا المركز — توقيع بصري مأخوذ من إطار الشعار */
export function DoubleRing({ className = "", strokeClass = "stroke-navy-800/15" }: { className?: string; strokeClass?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden fill="none">
      <circle cx="100" cy="100" r="98.5" className={strokeClass} strokeWidth="1" vectorEffect="non-scaling-stroke" />
      <circle cx="100" cy="100" r="93" className={strokeClass} strokeWidth="1" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** رأس الصفحات الداخلية — مبني على page-header من الهوية البصرية. */
export function PageHeader({ title, crumbs }: { title: string; crumbs: { label: string; href?: string }[] }) {
  return (
    <header className="relative overflow-hidden bg-brand-gradient text-white">
      <div aria-hidden className="absolute inset-0 bg-wave-dark" />
      <img
        src="/brand/mark-white.svg"
        alt=""
        aria-hidden
        className="pointer-events-none absolute -top-10 end-[6%] h-[300px] w-auto opacity-[0.08]"
      />
      <div className="container relative py-14 md:py-20">
        <h1 className="text-3xl font-extrabold md:text-5xl">{title}</h1>
        <nav aria-label="breadcrumb" className="mt-4 text-sm text-white/70">
          {crumbs.map((c, i) => (
            <span key={c.label}>
              {i > 0 && <span className="mx-2 text-white/40">‹</span>}
              {c.href ? (
                <a href={c.href} className="hover:text-white">
                  {c.label}
                </a>
              ) : (
                <span className="text-white/90">{c.label}</span>
              )}
            </span>
          ))}
        </nav>
        <span className="accent-bar mt-6" aria-hidden />
      </div>
    </header>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { formatBytes, formatDate, type Post, type Usage } from "@/lib/posts";
import PostEditor from "./PostEditor";
import SlidesManager from "./SlidesManager";
import DoctorsManager from "./DoctorsManager";

type Filter = "all" | "news" | "event" | "draft";

/** طلب JSON إلى API الإدارة — يرمي رسالة الخطأ العربية القادمة من السيرفر. */
export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: init?.body instanceof FormData ? init.headers : { "Content-Type": "application/json", ...init?.headers },
    credentials: "same-origin",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || `خطأ ${res.status}`), { status: res.status });
  return data as T;
}

export default function AdminApp() {
  const [email, setEmail] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    api<{ email: string }>("/api/admin/me/")
      .then((r) => setEmail(r.email))
      .catch(() => setEmail(null));
  }, []);

  async function logout() {
    await api("/api/admin/logout/", { method: "POST" }).catch(() => {});
    setEmail(null);
  }

  if (email === undefined)
    return (
      <Shell>
        <p className="text-center text-ink-mute">جارٍ التحميل…</p>
      </Shell>
    );
  if (!email)
    return (
      <Shell>
        <Login onDone={setEmail} />
      </Shell>
    );

  return (
    <Shell email={email} onLogout={logout}>
      <Sections onUnauthorized={() => setEmail(null)} />
    </Shell>
  );
}

function Shell({ children, email, onLogout }: { children: React.ReactNode; email?: string; onLogout?: () => void }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-white">
        <div className="container flex h-16 items-center justify-between gap-4">
          <a href="/admin/" className="flex items-center gap-3">
            <img src="/brand/mark-color.svg" alt="" className="h-9 w-auto" />
            <span className="font-bold text-navy-900">لوحة التحكم</span>
          </a>
          <div className="flex items-center gap-3 text-sm">
            <a href="/ar/news/" target="_blank" rel="noopener" className="text-ink-soft hover:text-navy-800">
              عرض الموقع
            </a>
            {email && (
              <>
                <span className="hidden font-en text-ink-mute sm:inline">{email}</span>
                <button onClick={onLogout} className="rounded-full border border-line px-3 py-1.5 text-navy-800 hover:bg-navy-50">
                  خروج
                </button>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="container py-8 md:py-12">{children}</main>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-md rounded-2xl border border-line bg-white p-8">{children}</div>;
}

function Login({ onDone }: { onDone: (email: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await api<{ email: string }>("/api/admin/login/", { method: "POST", body: JSON.stringify({ email, password }) });
      onDone(r.email);
    } catch (err) {
      setError((err as Error).message);
    }
    setBusy(false);
  }

  return (
    <Card>
      <h1 className="text-2xl font-bold text-navy-900">تسجيل الدخول</h1>
      <p className="mt-2 text-sm text-ink-soft">لإدارة أخبار وأحداث الصفا للجراحات التخصصية</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <Field label="البريد الإلكتروني">
          <input type="email" required dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} className="input font-en" autoComplete="username" />
        </Field>
        <Field label="كلمة المرور">
          <input type="password" required dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} className="input font-en" autoComplete="current-password" />
        </Field>
        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button disabled={busy} className="btn-primary w-full disabled:opacity-60">
          {busy ? "جارٍ الدخول…" : "دخول"}
        </button>
      </form>
    </Card>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-navy-900">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-mute">{hint}</span>}
    </label>
  );
}

/** أقسام لوحة التحكم */
function Sections({ onUnauthorized }: { onUnauthorized: () => void }) {
  const [section, setSection] = useState<"posts" | "doctors" | "slides" | "about">("posts");
  const items = [
    ["posts", "الأخبار والأحداث"],
    ["doctors", "الطاقم الطبي"],
    ["slides", "صور الواجهة"],
    ["about", "صور «من نحن»"],
  ] as const;
  return (
    <>
      <nav className="mb-8 grid grid-cols-2 gap-1 rounded-3xl border border-line bg-white p-1 sm:inline-flex sm:rounded-full" aria-label="أقسام لوحة التحكم">
        {items.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSection(key)}
            aria-current={section === key ? "page" : undefined}
            className={`flex-1 rounded-full px-5 py-2 text-sm font-bold transition-colors sm:flex-none ${
              section === key ? "bg-navy-800 text-white" : "text-ink-soft hover:bg-navy-50"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>
      {section === "posts" ? (
        <Dashboard onUnauthorized={onUnauthorized} />
      ) : section === "doctors" ? (
        <DoctorsManager onUnauthorized={onUnauthorized} />
      ) : (
        <SlidesManager key={section} area={section === "about" ? "about" : "hero"} onUnauthorized={onUnauthorized} />
      )}
    </>
  );
}

function Dashboard({ onUnauthorized }: { onUnauthorized: () => void }) {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [editing, setEditing] = useState<Post | "new" | null>(null);

  const guard = useCallback(
    (e: unknown) => {
      if ((e as { status?: number }).status === 401) onUnauthorized();
      else alert((e as Error).message);
    },
    [onUnauthorized],
  );

  const load = useCallback(async () => {
    try {
      const [p, u] = await Promise.all([api<Post[]>("/api/admin/posts/"), api<Usage>("/api/admin/usage/")]);
      setPosts(p);
      setUsage(u);
    } catch (e) {
      if ((e as { status?: number }).status === 401) onUnauthorized();
      else setError((e as Error).message);
    }
  }, [onUnauthorized]);

  useEffect(() => {
    load();
  }, [load]);

  async function togglePublish(p: Post) {
    try {
      await api(`/api/admin/posts/${p.id}/`, { method: "PATCH", body: JSON.stringify({ published: !p.published }) });
      load();
    } catch (e) {
      guard(e);
    }
  }

  async function remove(p: Post) {
    if (!confirm(`حذف "${p.title_ar}" نهائياً؟`)) return;
    try {
      await api(`/api/admin/posts/${p.id}/`, { method: "DELETE" });
      load();
    } catch (e) {
      guard(e);
    }
  }

  if (editing) {
    return (
      <PostEditor
        post={editing === "new" ? null : editing}
        maxImageBytes={usage?.max_image_bytes ?? 2 * 1024 * 1024}
        onClose={(saved) => {
          setEditing(null);
          if (saved) load();
        }}
      />
    );
  }

  const shown = (posts ?? []).filter((p) => (filter === "all" ? true : filter === "draft" ? !p.published : p.kind === filter));
  const tabs: [Filter, string][] = [
    ["all", "الكل"],
    ["news", "الأخبار"],
    ["event", "الأحداث"],
    ["draft", "المسودات"],
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-navy-900">الأخبار والأحداث</h1>
        <button onClick={() => setEditing("new")} className="btn-primary !py-2.5">
          + إضافة خبر أو حدث
        </button>
      </div>

      {usage && <UsageBar usage={usage} />}

      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              filter === key ? "bg-navy-800 text-white" : "border border-line bg-white text-ink-soft hover:bg-navy-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <p className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">خطأ: {error}</p>}
      {!posts && !error && <p className="mt-10 text-center text-ink-mute">جارٍ التحميل…</p>}
      {posts && shown.length === 0 && (
        <p className="mt-6 rounded-2xl border border-dashed border-line bg-white p-10 text-center text-ink-soft">لا يوجد شيء هنا بعد.</p>
      )}

      <ul className="mt-6 space-y-3">
        {shown.map((p) => (
          <li key={p.id} className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-4 sm:flex-row sm:items-center">
            <div className="h-20 w-full shrink-0 overflow-hidden rounded-xl bg-navy-50 sm:w-32">
              {p.cover_url && <img src={p.cover_url} alt="" className="h-full w-full object-cover" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className={`rounded-full px-2 py-0.5 font-semibold ${p.kind === "event" ? "bg-teal-100 text-teal-700" : "bg-navy-100 text-navy-800"}`}>
                  {p.kind === "event" ? "حدث" : "خبر"}
                </span>
                <span className={`rounded-full px-2 py-0.5 font-semibold ${p.published ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
                  {p.published ? "منشور" : "مسودة"}
                </span>
                <span className="text-ink-mute">{formatDate(p.created_at, "ar")}</span>
              </div>
              <p className="mt-1.5 truncate font-semibold text-navy-900">{p.title_ar}</p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2 text-sm">
              <button onClick={() => setEditing(p)} className="rounded-full border border-line px-3 py-1.5 text-navy-800 hover:bg-navy-50">
                تعديل
              </button>
              <button onClick={() => togglePublish(p)} className="rounded-full border border-line px-3 py-1.5 text-navy-800 hover:bg-navy-50">
                {p.published ? "إخفاء" : "نشر"}
              </button>
              {p.published && (
                <a href={`/ar/news/${p.id}/`} target="_blank" rel="noopener" className="rounded-full border border-line px-3 py-1.5 text-navy-800 hover:bg-navy-50">
                  عرض
                </a>
              )}
              <button onClick={() => remove(p)} className="rounded-full border border-red-200 px-3 py-1.5 text-red-700 hover:bg-red-50">
                حذف
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** شريط استهلاك المساحة — يتحوّل للأصفر عند 75% وللأحمر عند 90%. */
function UsageBar({ usage }: { usage: Usage }) {
  const rows = [
    { label: "مساحة الصور", used: usage.media_bytes, max: usage.media_quota, fmt: formatBytes },
    { label: "عدد المنشورات", used: usage.posts, max: usage.posts_max, fmt: (n: number) => String(n) },
  ];
  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-3">
      {rows.map((r) => {
        const pct = Math.min(100, (r.used / r.max) * 100);
        const color = pct >= 90 ? "bg-red-500" : pct >= 75 ? "bg-amber-500" : "bg-teal";
        return (
          <div key={r.label} className="rounded-2xl border border-line bg-white p-4">
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="font-semibold text-navy-900">{r.label}</span>
              <span className="font-en text-xs text-ink-mute" dir="ltr">
                {r.fmt(r.used)} / {r.fmt(r.max)}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-navy-50">
              <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max(pct, 1)}%` }} />
            </div>
            {pct >= 90 && <p className="mt-2 text-xs text-red-700">اقتربت من الحد — احذف محتوى قديماً.</p>}
          </div>
        );
      })}
      <div className="rounded-2xl border border-line bg-white p-4">
        <div className="flex items-baseline justify-between gap-2 text-sm">
          <span className="font-semibold text-navy-900">قاعدة البيانات</span>
          <span className="font-en text-xs text-ink-mute" dir="ltr">
            {formatBytes(usage.db_bytes)}
          </span>
        </div>
        <p className="mt-2 text-xs text-ink-mute">ملف SQLite على السيرفر</p>
      </div>
    </div>
  );
}

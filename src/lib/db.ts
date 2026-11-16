// قاعدة بيانات SQLite — تُستخدم على السيرفر فقط.
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Doctor, DoctorInput, Post, PostInput, Slide, SlideArea } from "./posts";

export const DATA_DIR = path.resolve(process.env.DATA_DIR || "data");
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
export const DB_FILE = path.join(DATA_DIR, "alsafa.db");

const MB = 1024 * 1024;
const num = (v: string | undefined, d: number) => (v && Number(v) > 0 ? Number(v) : d);

export const LIMITS = {
  mediaQuotaBytes: num(process.env.MEDIA_QUOTA_MB, 1024) * MB,
  maxImageBytes: num(process.env.MAX_IMAGE_MB, 2) * MB,
  maxPosts: num(process.env.MAX_POSTS, 2000),
  maxSlides: num(process.env.MAX_SLIDES, 10),
  maxGallery: num(process.env.MAX_GALLERY, 24),
  maxDoctors: num(process.env.MAX_DOCTORS, 200),
  titleMax: 200,
  bodyMax: 20000,
};

const SCHEMA = `
CREATE TABLE IF NOT EXISTS posts (
  id          TEXT PRIMARY KEY,
  kind        TEXT NOT NULL DEFAULT 'news' CHECK (kind IN ('news','event')),
  title_ar    TEXT NOT NULL CHECK (length(title_ar) BETWEEN 1 AND 200),
  title_en    TEXT CHECK (title_en IS NULL OR length(title_en) <= 200),
  body_ar     TEXT NOT NULL DEFAULT '' CHECK (length(body_ar) <= 20000),
  body_en     TEXT CHECK (body_en IS NULL OR length(body_en) <= 20000),
  cover_url   TEXT CHECK (cover_url IS NULL OR length(cover_url) <= 300),
  event_date  TEXT,
  location    TEXT CHECK (location IS NULL OR length(location) <= 200),
  published   INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS posts_pub_created ON posts (published, created_at DESC);

-- صور الكاروسيل في الواجهة الرئيسية
CREATE TABLE IF NOT EXISTS slides (
  id         TEXT PRIMARY KEY,
  area       TEXT NOT NULL DEFAULT 'hero',
  image_url  TEXT NOT NULL CHECK (length(image_url) <= 300),
  alt        TEXT CHECK (alt IS NULL OR length(alt) <= 200),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

-- الطاقم الطبي
CREATE TABLE IF NOT EXISTS doctors (
  id         TEXT PRIMARY KEY,
  name_ar    TEXT NOT NULL CHECK (length(name_ar) BETWEEN 1 AND 120),
  name_en    TEXT CHECK (name_en IS NULL OR length(name_en) <= 120),
  title_ar   TEXT CHECK (title_ar IS NULL OR length(title_ar) <= 200),
  title_en   TEXT CHECK (title_en IS NULL OR length(title_en) <= 200),
  bio_ar     TEXT CHECK (bio_ar IS NULL OR length(bio_ar) <= 2000),
  bio_en     TEXT CHECK (bio_en IS NULL OR length(bio_en) <= 2000),
  photo_url  TEXT CHECK (photo_url IS NULL OR length(photo_url) <= 300),
  sort_order INTEGER NOT NULL DEFAULT 0,
  published  INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS admins (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  admin_id   INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
`;

const g = globalThis as unknown as { __alsafaDb?: Database.Database; __alsafaSchema?: string };

/** اتصال واحد مشترك (يبقى عبر إعادة التحميل في وضع التطوير). */
export function db(): Database.Database {
  if (!g.__alsafaDb) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    const d = new Database(DB_FILE);
    d.pragma("journal_mode = WAL");
    d.pragma("foreign_keys = ON");
    d.pragma("busy_timeout = 5000");
    g.__alsafaDb = d;
  }
  // في وضع التطوير يبقى الاتصال مفتوحاً بعد تعديل الكود — نطبّق الجداول الجديدة إن تغيّر المخطط
  if (g.__alsafaSchema !== SCHEMA) {
    g.__alsafaDb.exec(SCHEMA);
    migrate(g.__alsafaDb);
    g.__alsafaSchema = SCHEMA;
  }
  return g.__alsafaDb;
}

/** ترقيات بسيطة لقواعد بيانات أُنشئت بنسخة أقدم. */
function migrate(d: Database.Database) {
  const cols = (d.prepare("PRAGMA table_info(slides)").all() as { name: string }[]).map((c) => c.name);
  if (!cols.includes("area")) d.exec("ALTER TABLE slides ADD COLUMN area TEXT NOT NULL DEFAULT 'hero'");
  d.exec("CREATE INDEX IF NOT EXISTS slides_area_order ON slides (area, sort_order)");
}

export const slideLimit = (area: SlideArea) => (area === "about" ? LIMITS.maxGallery : LIMITS.maxSlides);

type Row = Omit<Post, "published"> & { published: number };
const toPost = (r: Row | undefined): Post | null => (r ? { ...r, published: r.published === 1 } : null);

// ---------- قراءة عامة ----------

export function listPublished(limit = 100): Post[] {
  const rows = db().prepare("SELECT * FROM posts WHERE published = 1 ORDER BY created_at DESC LIMIT ?").all(limit) as Row[];
  return rows.map((r) => toPost(r)!);
}

export function getPublished(id: string): Post | null {
  return toPost(db().prepare("SELECT * FROM posts WHERE id = ? AND published = 1").get(id) as Row | undefined);
}

// ---------- إدارة ----------

export function listAll(): Post[] {
  return (db().prepare("SELECT * FROM posts ORDER BY created_at DESC").all() as Row[]).map((r) => toPost(r)!);
}

export function getPost(id: string): Post | null {
  return toPost(db().prepare("SELECT * FROM posts WHERE id = ?").get(id) as Row | undefined);
}

export function countPosts(): number {
  return (db().prepare("SELECT count(*) AS n FROM posts").get() as { n: number }).n;
}

export function createPost(input: PostInput): Post {
  if (countPosts() >= LIMITS.maxPosts) throw new LimitError(`تم الوصول للحد الأقصى لعدد المنشورات (${LIMITS.maxPosts}). احذف منشورات قديمة أولاً.`);
  const now = new Date().toISOString();
  const id = randomUUID();
  db()
    .prepare(
      `INSERT INTO posts (id, kind, title_ar, title_en, body_ar, body_en, cover_url, event_date, location, published, created_at, updated_at)
       VALUES (@id, @kind, @title_ar, @title_en, @body_ar, @body_en, @cover_url, @event_date, @location, @published, @now, @now)`,
    )
    .run({ ...input, id, now, published: input.published ? 1 : 0 });
  return getPost(id)!;
}

export function updatePost(id: string, input: PostInput): Post | null {
  db()
    .prepare(
      `UPDATE posts SET kind=@kind, title_ar=@title_ar, title_en=@title_en, body_ar=@body_ar, body_en=@body_en,
         cover_url=@cover_url, event_date=@event_date, location=@location, published=@published, updated_at=@now
       WHERE id=@id`,
    )
    .run({ ...input, id, now: new Date().toISOString(), published: input.published ? 1 : 0 });
  return getPost(id);
}

export function setPublished(id: string, published: boolean) {
  db().prepare("UPDATE posts SET published = ?, updated_at = ? WHERE id = ?").run(published ? 1 : 0, new Date().toISOString(), id);
}

export function deletePost(id: string) {
  db().prepare("DELETE FROM posts WHERE id = ?").run(id);
}

/** كل الصور المستخدمة (أغلفة المنشورات + صور الكاروسيل) — ما عداها يُعتبر يتيماً ويُحذف. */
export function referencedMedia(): Set<string> {
  const rows = db()
    .prepare(`SELECT cover_url AS url FROM posts WHERE cover_url IS NOT NULL
       UNION SELECT image_url FROM slides
       UNION SELECT photo_url FROM doctors WHERE photo_url IS NOT NULL`)
    .all() as { url: string }[];
  return new Set(rows.map((r) => r.url));
}

// ---------- صور الواجهة (الكاروسيل) ----------

export function listSlides(area: SlideArea = "hero"): Slide[] {
  return db().prepare("SELECT * FROM slides WHERE area = ? ORDER BY sort_order, created_at").all(area) as Slide[];
}

export function getSlide(id: string): Slide | null {
  return (db().prepare("SELECT * FROM slides WHERE id = ?").get(id) as Slide | undefined) ?? null;
}

export function createSlide(area: SlideArea, image_url: string, alt: string | null): Slide {
  const count = (db().prepare("SELECT count(*) AS n FROM slides WHERE area = ?").get(area) as { n: number }).n;
  const max = slideLimit(area);
  if (count >= max) throw new LimitError(`الحد الأقصى ${max} صورة في هذا القسم. احذف صورة أولاً.`);
  const id = randomUUID();
  const next = (db().prepare("SELECT coalesce(max(sort_order), -1) + 1 AS n FROM slides WHERE area = ?").get(area) as { n: number }).n;
  db()
    .prepare("INSERT INTO slides (id, area, image_url, alt, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?)")
    .run(id, area, image_url, alt, next, new Date().toISOString());
  return getSlide(id)!;
}

export function deleteSlide(id: string) {
  db().prepare("DELETE FROM slides WHERE id = ?").run(id);
}

/** يعيد ترتيب الصور حسب قائمة المعرّفات المرسلة. */
export function reorderSlides(area: SlideArea, ids: string[]) {
  const stmt = db().prepare("UPDATE slides SET sort_order = ? WHERE id = ? AND area = ?");
  db().transaction(() => ids.forEach((id, i) => stmt.run(i, id, area)))();
}

// ---------- الطاقم الطبي ----------

type DoctorRow = Omit<Doctor, "published"> & { published: number };
const toDoctor = (r: DoctorRow | undefined): Doctor | null => (r ? { ...r, published: r.published === 1 } : null);

export function listDoctors(onlyPublished = true): Doctor[] {
  const where = onlyPublished ? "WHERE published = 1" : "";
  return (db().prepare(`SELECT * FROM doctors ${where} ORDER BY sort_order, created_at`).all() as DoctorRow[]).map((r) => toDoctor(r)!);
}

export function getDoctor(id: string): Doctor | null {
  return toDoctor(db().prepare("SELECT * FROM doctors WHERE id = ?").get(id) as DoctorRow | undefined);
}

export function createDoctor(input: DoctorInput): Doctor {
  const count = (db().prepare("SELECT count(*) AS n FROM doctors").get() as { n: number }).n;
  if (count >= LIMITS.maxDoctors) throw new LimitError(`الحد الأقصى ${LIMITS.maxDoctors} عضواً في الطاقم.`);
  const id = randomUUID();
  const now = new Date().toISOString();
  const next = (db().prepare("SELECT coalesce(max(sort_order), -1) + 1 AS n FROM doctors").get() as { n: number }).n;
  db()
    .prepare(
      `INSERT INTO doctors (id, name_ar, name_en, title_ar, title_en, bio_ar, bio_en, photo_url, sort_order, published, created_at, updated_at)
       VALUES (@id, @name_ar, @name_en, @title_ar, @title_en, @bio_ar, @bio_en, @photo_url, @next, @published, @now, @now)`,
    )
    .run({ ...input, id, next, now, published: input.published ? 1 : 0 });
  return getDoctor(id)!;
}

export function updateDoctor(id: string, input: DoctorInput): Doctor | null {
  db()
    .prepare(
      `UPDATE doctors SET name_ar=@name_ar, name_en=@name_en, title_ar=@title_ar, title_en=@title_en, bio_ar=@bio_ar,
         bio_en=@bio_en, photo_url=@photo_url, published=@published, updated_at=@now WHERE id=@id`,
    )
    .run({ ...input, id, now: new Date().toISOString(), published: input.published ? 1 : 0 });
  return getDoctor(id);
}

export function deleteDoctor(id: string) {
  db().prepare("DELETE FROM doctors WHERE id = ?").run(id);
}

export function reorderDoctors(ids: string[]) {
  const stmt = db().prepare("UPDATE doctors SET sort_order = ? WHERE id = ?");
  db().transaction(() => ids.forEach((id, i) => stmt.run(i, id)))();
}

export function dbSizeBytes(): number {
  return [DB_FILE, `${DB_FILE}-wal`].reduce((sum, f) => sum + (fs.existsSync(f) ? fs.statSync(f).size : 0), 0);
}

export class LimitError extends Error {}

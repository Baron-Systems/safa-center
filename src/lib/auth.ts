// تسجيل دخول المشرفين وجلساتهم — للسيرفر فقط.
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { db } from "./db";

export const SESSION_COOKIE = "alsafa_admin";
const SESSION_DAYS = 14;

// نفس الصيغة المستخدمة في scripts/admin.mjs
export function verifyPassword(password: string, stored: string): boolean {
  const [algo, salt, hash] = stored.split("$");
  if (algo !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password, Buffer.from(salt, "hex"), expected.length);
  return timingSafeEqual(actual, expected);
}

const sha = (s: string) => createHash("sha256").update(s).digest("hex");

export type Admin = { id: number; email: string };

export function findAdminByCredentials(email: string, password: string): Admin | null {
  const row = db().prepare("SELECT id, email, password_hash FROM admins WHERE email = ?").get(email.trim()) as
    | (Admin & { password_hash: string })
    | undefined;
  // نتحقق دائماً من كلمة مرور (حتى إن لم يوجد المستخدم) لتوحيد زمن الاستجابة
  const ok = verifyPassword(password, row?.password_hash ?? "scrypt$00$00");
  return row && ok ? { id: row.id, email: row.email } : null;
}

export async function createSession(adminId: number) {
  const token = randomBytes(32).toString("hex");
  const expires = Date.now() + SESSION_DAYS * 86400_000;
  db().prepare("DELETE FROM sessions WHERE expires_at < ?").run(Date.now());
  db().prepare("INSERT INTO sessions (token_hash, admin_id, expires_at) VALUES (?, ?, ?)").run(sha(token), adminId, expires);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production" && process.env.INSECURE_COOKIES !== "1",
    path: "/",
    expires: new Date(expires),
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) db().prepare("DELETE FROM sessions WHERE token_hash = ?").run(sha(token));
  jar.delete(SESSION_COOKIE);
}

export async function currentAdmin(): Promise<Admin | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const row = db()
    .prepare("SELECT a.id, a.email FROM sessions s JOIN admins a ON a.id = s.admin_id WHERE s.token_hash = ? AND s.expires_at > ?")
    .get(sha(token), Date.now()) as Admin | undefined;
  return row ?? null;
}

/** للطلبات التي تعدّل البيانات: يرفض الطلبات القادمة من موقع آخر. */
export async function sameOrigin(): Promise<boolean> {
  const h = await headers();
  const origin = h.get("origin");
  if (!origin) return true; // بعض المتصفحات لا ترسله في نفس الموقع
  const host = h.get("x-forwarded-host") ?? h.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

// حماية بسيطة من تخمين كلمة المرور: 5 محاولات خاطئة لكل IP كل 15 دقيقة
const attempts = new Map<string, { n: number; until: number }>();

export function loginBlocked(ip: string) {
  const a = attempts.get(ip);
  return Boolean(a && a.until > Date.now() && a.n >= 5);
}

export function loginFailed(ip: string) {
  const a = attempts.get(ip);
  if (!a || a.until < Date.now()) attempts.set(ip, { n: 1, until: Date.now() + 15 * 60_000 });
  else a.n++;
}

export function loginSucceeded(ip: string) {
  attempts.delete(ip);
}

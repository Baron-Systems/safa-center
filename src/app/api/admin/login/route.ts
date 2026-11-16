import type { NextRequest } from "next/server";
import { createSession, findAdminByCredentials, loginBlocked, loginFailed, loginSucceeded, sameOrigin } from "@/lib/auth";
import { fail, json } from "@/lib/api";

export async function POST(req: NextRequest) {
  if (!(await sameOrigin())) return fail("طلب مرفوض", 403);
  const ip = req.headers.get("x-real-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "local";
  if (loginBlocked(ip)) return fail("محاولات كثيرة خاطئة. حاول بعد 15 دقيقة.", 429);
  const { email, password } = (await req.json().catch(() => ({}))) as { email?: string; password?: string };
  const admin = email && password ? findAdminByCredentials(String(email), String(password)) : null;
  if (!admin) {
    loginFailed(ip);
    return fail("البريد الإلكتروني أو كلمة المرور غير صحيحة.", 401);
  }
  loginSucceeded(ip);
  await createSession(admin.id);
  return json({ email: admin.email });
}

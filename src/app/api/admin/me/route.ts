import { currentAdmin } from "@/lib/auth";
import { fail, json } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await currentAdmin();
  return admin ? json({ email: admin.email }) : fail("غير مسجل", 401);
}

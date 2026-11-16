// يخدم الصور المرفوعة من DATA_DIR/uploads (لأن مجلد public لا يتحدّث بعد البناء).
import fs from "node:fs";
import path from "node:path";
import type { NextRequest } from "next/server";
import { UPLOAD_DIR } from "@/lib/db";
import { MEDIA_NAME_RE, MIME } from "@/lib/media";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (!MEDIA_NAME_RE.test(name)) return new Response("Not found", { status: 404 });
  const file = path.join(UPLOAD_DIR, name);
  if (!fs.existsSync(file)) return new Response("Not found", { status: 404 });
  return new Response(fs.readFileSync(file), {
    headers: {
      "Content-Type": MIME[name.split(".").pop()!],
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

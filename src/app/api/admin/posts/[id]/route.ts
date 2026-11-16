import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { deletePost, getPost, setPublished, updatePost } from "@/lib/db";
import { removeMedia } from "@/lib/media";
import { fail, handleError, json, parsePostInput, requireAdmin } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

/** تعديل كامل للمنشور */
export async function PUT(req: NextRequest, { params }: Ctx) {
  const admin = await requireAdmin(true);
  if (admin instanceof NextResponse) return admin;
  const { id } = await params;
  const old = getPost(id);
  if (!old) return fail("غير موجود", 404);
  try {
    const updated = updatePost(id, parsePostInput(await req.json()));
    if (old.cover_url && old.cover_url !== updated?.cover_url) removeMedia(old.cover_url); // تحرير مساحة الصورة القديمة
    return json(updated);
  } catch (e) {
    return handleError(e);
  }
}

/** نشر / إخفاء سريع */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const admin = await requireAdmin(true);
  if (admin instanceof NextResponse) return admin;
  const { id } = await params;
  if (!getPost(id)) return fail("غير موجود", 404);
  const { published } = (await req.json().catch(() => ({}))) as { published?: boolean };
  setPublished(id, Boolean(published));
  return json(getPost(id));
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const admin = await requireAdmin(true);
  if (admin instanceof NextResponse) return admin;
  const { id } = await params;
  const old = getPost(id);
  if (!old) return fail("غير موجود", 404);
  deletePost(id);
  removeMedia(old.cover_url);
  return json({ ok: true });
}

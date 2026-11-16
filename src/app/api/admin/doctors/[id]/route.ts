import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { deleteDoctor, getDoctor, updateDoctor } from "@/lib/db";
import { removeMedia } from "@/lib/media";
import { fail, handleError, json, parseDoctorInput, requireAdmin } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Ctx) {
  const admin = await requireAdmin(true);
  if (admin instanceof NextResponse) return admin;
  const { id } = await params;
  const old = getDoctor(id);
  if (!old) return fail("غير موجود", 404);
  try {
    const doc = updateDoctor(id, parseDoctorInput(await req.json()));
    // حُذفت الصورة أو استُبدلت → نحذف القديمة من القرص
    if (old.photo_url && old.photo_url !== doc?.photo_url) removeMedia(old.photo_url);
    return json(doc);
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const admin = await requireAdmin(true);
  if (admin instanceof NextResponse) return admin;
  const { id } = await params;
  const doc = getDoctor(id);
  if (!doc) return fail("غير موجود", 404);
  deleteDoctor(id);
  if (doc.photo_url) removeMedia(doc.photo_url);
  return json({ ok: true });
}

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { deleteSlide, getSlide } from "@/lib/db";
import { removeMedia } from "@/lib/media";
import { fail, json, requireAdmin } from "@/lib/api";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(true);
  if (admin instanceof NextResponse) return admin;
  const { id } = await params;
  const slide = getSlide(id);
  if (!slide) return fail("غير موجود", 404);
  deleteSlide(id);
  removeMedia(slide.image_url);
  return json({ ok: true });
}

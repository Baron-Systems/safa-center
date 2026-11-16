import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { LIMITS, LimitError, createDoctor, listDoctors, reorderDoctors } from "@/lib/db";
import { handleError, json, parseDoctorInput, requireAdmin } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  return json({ doctors: listDoctors(false), max: LIMITS.maxDoctors, max_image_bytes: LIMITS.maxImageBytes });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(true);
  if (admin instanceof NextResponse) return admin;
  try {
    return json(createDoctor(parseDoctorInput(await req.json())), 201);
  } catch (e) {
    return handleError(e);
  }
}

/** إعادة الترتيب: { order: [id, id, ...] } */
export async function PUT(req: NextRequest) {
  const admin = await requireAdmin(true);
  if (admin instanceof NextResponse) return admin;
  try {
    const { order } = (await req.json()) as { order?: unknown };
    if (!Array.isArray(order) || !order.every((x) => typeof x === "string")) throw new LimitError("ترتيب غير صالح.");
    reorderDoctors(order as string[]);
    return json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}

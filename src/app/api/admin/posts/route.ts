import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createPost, listAll } from "@/lib/db";
import { handleError, json, parsePostInput, requireAdmin } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  return json(listAll());
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(true);
  if (admin instanceof NextResponse) return admin;
  try {
    return json(createPost(parsePostInput(await req.json())), 201);
  } catch (e) {
    return handleError(e);
  }
}

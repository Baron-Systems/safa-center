import { NextResponse } from "next/server";
import { LIMITS, countPosts, dbSizeBytes } from "@/lib/db";
import { mediaUsageBytes } from "@/lib/media";
import { json, requireAdmin } from "@/lib/api";
import type { Usage } from "@/lib/posts";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  const usage: Usage = {
    media_bytes: mediaUsageBytes(),
    media_quota: LIMITS.mediaQuotaBytes,
    db_bytes: dbSizeBytes(),
    posts: countPosts(),
    posts_max: LIMITS.maxPosts,
    max_image_bytes: LIMITS.maxImageBytes,
  };
  return json(usage);
}

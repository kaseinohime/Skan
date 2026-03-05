import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { AI_LIMITS } from "@/lib/ai/caption";

function todayStartEnd(): { start: string; end: string } {
  const d = new Date();
  const s = d.toISOString().slice(0, 10);
  const next = new Date(s + "T00:00:00.000Z");
  next.setUTCDate(next.getUTCDate() + 1);
  const e = next.toISOString().slice(0, 19) + "Z";
  return { start: `${s}T00:00:00.000Z`, end: e };
}

export async function GET() {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "ログインしてください。" } },
      { status: 401 }
    );
  }

  const supabase = await createClient();
  const { start, end } = todayStartEnd();

  const [captionRes, hashtagRes] = await Promise.all([
    supabase
      .from("ai_usage")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("usage_type", "caption")
      .gte("created_at", start)
      .lt("created_at", end),
    supabase
      .from("ai_usage")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("usage_type", "hashtag")
      .gte("created_at", start)
      .lt("created_at", end),
  ]);

  const captionUsed = captionRes.count ?? 0;
  const hashtagUsed = hashtagRes.count ?? 0;

  return NextResponse.json({
    caption: {
      used: captionUsed,
      limit: AI_LIMITS.caption,
      remaining: Math.max(0, AI_LIMITS.caption - captionUsed),
    },
    hashtag: {
      used: hashtagUsed,
      limit: AI_LIMITS.hashtag,
      remaining: Math.max(0, AI_LIMITS.hashtag - hashtagUsed),
    },
  });
}

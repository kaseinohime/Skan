import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getOrgRateLimit, rollingWindow } from "@/lib/ai/rate-limit";

export async function GET() {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "ログインしてください。" } },
      { status: 401 }
    );
  }

  const supabase = await createClient();
  const { windowHours, limitPerWindow } = await getOrgRateLimit(supabase, user.id);
  const { start, end } = rollingWindow(windowHours);

  const [captionRes, hashtagRes, suggestRes] = await Promise.all([
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
    supabase
      .from("ai_usage")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("usage_type", "insights_suggest")
      .gte("created_at", start)
      .lt("created_at", end),
  ]);

  const captionUsed = captionRes.count ?? 0;
  const hashtagUsed = hashtagRes.count ?? 0;
  const suggestUsed = suggestRes.count ?? 0;

  // limitPerWindow === 0 は無制限（Pro/Enterprise）。null を返してフロントで「無制限」と表示させる
  const unlimited = limitPerWindow === 0;

  return NextResponse.json({
    windowHours,
    windowLabel: windowHours >= 24
      ? `${windowHours / 24}日あたり`
      : `${windowHours}時間あたり`,
    caption: {
      used: captionUsed,
      limit: unlimited ? null : limitPerWindow,
      remaining: unlimited ? null : Math.max(0, limitPerWindow - captionUsed),
    },
    hashtag: {
      used: hashtagUsed,
      limit: unlimited ? null : limitPerWindow,
      remaining: unlimited ? null : Math.max(0, limitPerWindow - hashtagUsed),
    },
    insights_suggest: {
      used: suggestUsed,
      limit: unlimited ? null : limitPerWindow,
      remaining: unlimited ? null : Math.max(0, limitPerWindow - suggestUsed),
    },
  });
}

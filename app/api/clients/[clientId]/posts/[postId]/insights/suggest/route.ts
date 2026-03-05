import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { NextResponse } from "next/server";
import {
  generateInsightsSuggestions,
  INSIGHTS_SUGGEST_DAILY_LIMIT,
} from "@/lib/ai/insights-suggest";

type Params = { params: Promise<{ clientId: string; postId: string }> };

function todayStartEnd(): { start: string; end: string } {
  const s = new Date().toISOString().slice(0, 10);
  const next = new Date(`${s}T00:00:00.000Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  return { start: `${s}T00:00:00.000Z`, end: next.toISOString() };
}

export async function POST(_req: Request, { params }: Params) {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "ログインしてください。" } },
      { status: 401 }
    );
  }

  // clientロールは改善提案生成不可
  if (user.system_role === "client") {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "権限がありません。" } },
      { status: 403 }
    );
  }

  const { clientId, postId } = await params;
  const supabase = await createClient();

  // レート制限チェック（ユーザーごとに1日30回まで）
  const { start, end } = todayStartEnd();
  const { count } = await supabase
    .from("ai_usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("usage_type", "insights_suggest")
    .gte("created_at", start)
    .lt("created_at", end);

  if ((count ?? 0) >= INSIGHTS_SUGGEST_DAILY_LIMIT) {
    return NextResponse.json(
      {
        error: {
          code: "RATE_LIMIT",
          message: `本日の改善提案生成回数の上限（${INSIGHTS_SUGGEST_DAILY_LIMIT}回）に達しました。明日またお試しください。`,
        },
      },
      { status: 429 }
    );
  }

  // 投稿情報とインサイスデータを取得
  const [{ data: post, error: postError }, { data: insights }] =
    await Promise.all([
      supabase
        .from("posts")
        .select("id, title, platform, post_type")
        .eq("id", postId)
        .eq("client_id", clientId)
        .single(),
      supabase
        .from("post_insights")
        .select(
          "reach, saves, follower_reach, followers_count, profile_visits, follows, web_taps, discovery, save_rate, home_rate, profile_visit_rate, follower_conversion_rate, target_segment, genre, theme, memo"
        )
        .eq("post_id", postId)
        .maybeSingle(),
    ]);

  if (postError || !post) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "投稿が見つかりません。" } },
      { status: 404 }
    );
  }

  if (!insights) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "インサイスを先に入力してから提案を生成してください。",
        },
      },
      { status: 400 }
    );
  }

  // アカウント設定からKPI目標を取得
  const { data: accountSettings } = await supabase
    .from("client_account_settings")
    .select("kpi_save_rate_target, kpi_home_rate_target")
    .eq("client_id", clientId)
    .maybeSingle();

  const kpiSaveRateTarget = accountSettings?.kpi_save_rate_target ?? 0.02;
  const kpiHomeRateTarget = accountSettings?.kpi_home_rate_target ?? 0.40;

  try {
    const suggestions = await generateInsightsSuggestions({
      postTitle: post.title,
      platform: post.platform,
      postType: post.post_type,
      insights,
      kpiSaveRateTarget,
      kpiHomeRateTarget,
    });

    // 利用履歴を記録
    await supabase.from("ai_usage").insert({
      user_id: user.id,
      usage_type: "insights_suggest",
    });

    return NextResponse.json({ suggestions });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "改善提案の生成に失敗しました。";
    return NextResponse.json(
      { error: { code: "AI_ERROR", message } },
      { status: 502 }
    );
  }
}

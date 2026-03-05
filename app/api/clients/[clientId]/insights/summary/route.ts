import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ clientId: string }> };

export async function GET(request: Request, { params }: Params) {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "ログインしてください。" } },
      { status: 401 }
    );
  }

  const { clientId } = await params;
  const { searchParams } = new URL(request.url);
  const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()), 10);
  const month = parseInt(searchParams.get("month") ?? String(new Date().getMonth() + 1), 10);

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "year・month が不正です。" } },
      { status: 400 }
    );
  }

  const from = new Date(year, month - 1, 1).toISOString();
  const to = new Date(year, month, 1).toISOString(); // 翌月1日（exclusive）

  const supabase = await createClient();

  // 対象月の投稿 + インサイト を結合取得
  const { data: rows, error } = await supabase
    .from("posts")
    .select(
      `id, title, status, post_type, platform, scheduled_at,
       post_insights(
         id, reach, saves, follower_reach, followers_count,
         profile_visits, follows, web_taps, discovery,
         save_rate, home_rate, profile_visit_rate,
         follower_conversion_rate, web_tap_rate,
         target_segment, genre, theme, memo, recorded_at
       )`
    )
    .eq("client_id", clientId)
    .gte("scheduled_at", from)
    .lt("scheduled_at", to)
    .order("scheduled_at", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: error.message } },
      { status: 500 }
    );
  }

  const posts = rows ?? [];

  // インサイトありの投稿のみ集計
  // Supabase は 1:1 関係でも配列型として推論するため、要素型を抽出
  type InsightsArr = NonNullable<(typeof posts)[number]["post_insights"]>;
  type InsightsRow = InsightsArr extends Array<infer T> ? T : InsightsArr;

  function getInsights(pi: (typeof posts)[number]["post_insights"]): InsightsRow | null {
    if (!pi) return null;
    if (Array.isArray(pi)) return (pi[0] as InsightsRow) ?? null;
    return pi as unknown as InsightsRow;
  }

  const withInsights = posts
    .map((p) => ({ post: p, insights: getInsights(p.post_insights) }))
    .filter((x) => x.insights !== null);

  const totalReach = withInsights.reduce((s, x) => s + (x.insights!.reach ?? 0), 0);
  const totalSaves = withInsights.reduce((s, x) => s + (x.insights!.saves ?? 0), 0);
  const totalFollows = withInsights.reduce((s, x) => s + (x.insights!.follows ?? 0), 0);

  function avg(arr: (number | null)[]): number | null {
    const valid = arr.filter((v): v is number => v != null);
    if (valid.length === 0) return null;
    return valid.reduce((a, b) => a + b, 0) / valid.length;
  }

  const avgSaveRate = avg(withInsights.map((x) => x.insights!.save_rate));
  const avgHomeRate = avg(withInsights.map((x) => x.insights!.home_rate));
  const avgProfileVisitRate = avg(withInsights.map((x) => x.insights!.profile_visit_rate));
  const avgFollowerConversionRate = avg(
    withInsights.map((x) => x.insights!.follower_conversion_rate)
  );

  // グラフ用: 日付ごとのリーチ・保存数 時系列
  const trendPoints = withInsights.map((x) => ({
    date: x.post.scheduled_at?.slice(0, 10) ?? "",
    title: x.post.title,
    reach: x.insights!.reach ?? 0,
    saves: x.insights!.saves ?? 0,
    follows: x.insights!.follows ?? 0,
    save_rate: x.insights!.save_rate,
    home_rate: x.insights!.home_rate,
  }));

  // 投稿一覧（インサイト有無を含む）
  const postList = posts.map((p) => {
    const ins = getInsights(p.post_insights);
    return {
      id: p.id,
      title: p.title,
      status: p.status,
      post_type: p.post_type,
      platform: p.platform,
      scheduled_at: p.scheduled_at,
      has_insights: ins !== null,
      reach: ins?.reach ?? null,
      saves: ins?.saves ?? null,
      save_rate: ins?.save_rate ?? null,
      home_rate: ins?.home_rate ?? null,
      profile_visit_rate: ins?.profile_visit_rate ?? null,
      follower_conversion_rate: ins?.follower_conversion_rate ?? null,
      genre: ins?.genre ?? null,
      theme: ins?.theme ?? null,
      memo: ins?.memo ?? null,
    };
  });

  return NextResponse.json({
    year,
    month,
    summary: {
      total_reach: totalReach,
      total_saves: totalSaves,
      total_follows: totalFollows,
      avg_save_rate: avgSaveRate,
      avg_home_rate: avgHomeRate,
      avg_profile_visit_rate: avgProfileVisitRate,
      avg_follower_conversion_rate: avgFollowerConversionRate,
      post_count: posts.length,
      posts_with_insights_count: withInsights.length,
    },
    trend: trendPoints,
    posts: postList,
  });
}

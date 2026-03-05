import type { SupabaseClient } from "@supabase/supabase-js";

export type ReportPost = {
  id: string;
  title: string;
  scheduled_at: string | null;
  platform: string;
  post_type: string;
  has_insights: boolean;
  reach: number | null;
  saves: number | null;
  save_rate: number | null;
  home_rate: number | null;
  profile_visit_rate: number | null;
  genre: string | null;
  memo: string | null;
};

export type ReportTrendPoint = {
  date: string;
  title: string;
  reach: number;
  saves: number;
  save_rate: number | null;
  home_rate: number | null;
};

export type ReportSummary = {
  total_reach: number;
  total_saves: number;
  avg_save_rate: number | null;
  avg_home_rate: number | null;
  avg_profile_visit_rate: number | null;
  post_count: number;
  posts_with_insights_count: number;
};

export type ReportData = {
  client: { name: string; instagram_username: string | null };
  year: number;
  month: number;
  summary: ReportSummary;
  trend: ReportTrendPoint[];
  posts: ReportPost[];
  kpiSaveRateTarget: number;
  kpiHomeRateTarget: number;
};

function avg(arr: (number | null)[]): number | null {
  const valid = arr.filter((v): v is number => v != null);
  if (valid.length === 0) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

export async function buildReportData(
  supabase: SupabaseClient,
  clientId: string,
  year: number,
  month: number
): Promise<ReportData | null> {
  const from = new Date(year, month - 1, 1).toISOString();
  const to = new Date(year, month, 1).toISOString();

  const [{ data: client }, { data: rows }, { data: accountSettings }] =
    await Promise.all([
      supabase
        .from("clients")
        .select("name, instagram_username")
        .eq("id", clientId)
        .single(),
      supabase
        .from("posts")
        .select(
          `id, title, status, post_type, platform, scheduled_at,
           post_insights(
             reach, saves, profile_visits, follows,
             save_rate, home_rate, profile_visit_rate,
             genre, memo
           )`
        )
        .eq("client_id", clientId)
        .gte("scheduled_at", from)
        .lt("scheduled_at", to)
        .order("scheduled_at", { ascending: true }),
      supabase
        .from("client_account_settings")
        .select("kpi_save_rate_target, kpi_home_rate_target")
        .eq("client_id", clientId)
        .maybeSingle(),
    ]);

  if (!client || !rows) return null;

  const kpiSaveRateTarget = accountSettings?.kpi_save_rate_target ?? 0.02;
  const kpiHomeRateTarget = accountSettings?.kpi_home_rate_target ?? 0.4;

  // Supabase は 1:1 関係でも配列型として推論するため要素型を抽出
  type RowType = NonNullable<typeof rows>[number];
  type InsightsArr = NonNullable<RowType["post_insights"]>;
  type InsightsRow = InsightsArr extends Array<infer T> ? T : InsightsArr;

  function getInsights(pi: RowType["post_insights"]): InsightsRow | null {
    if (!pi) return null;
    if (Array.isArray(pi)) return (pi[0] as InsightsRow) ?? null;
    return pi as unknown as InsightsRow;
  }

  const posts: ReportPost[] = rows.map((p) => {
    const ins = getInsights(p.post_insights);
    return {
      id: p.id,
      title: p.title,
      scheduled_at: p.scheduled_at,
      platform: p.platform,
      post_type: p.post_type,
      has_insights: ins !== null,
      reach: ins?.reach ?? null,
      saves: ins?.saves ?? null,
      save_rate: ins?.save_rate ?? null,
      home_rate: ins?.home_rate ?? null,
      profile_visit_rate: ins?.profile_visit_rate ?? null,
      genre: ins?.genre ?? null,
      memo: ins?.memo ?? null,
    };
  });

  const withInsights = posts.filter((p) => p.has_insights);

  const summary: ReportSummary = {
    total_reach: withInsights.reduce((s, p) => s + (p.reach ?? 0), 0),
    total_saves: withInsights.reduce((s, p) => s + (p.saves ?? 0), 0),
    avg_save_rate: avg(withInsights.map((p) => p.save_rate)),
    avg_home_rate: avg(withInsights.map((p) => p.home_rate)),
    avg_profile_visit_rate: avg(withInsights.map((p) => p.profile_visit_rate)),
    post_count: posts.length,
    posts_with_insights_count: withInsights.length,
  };

  const trend: ReportTrendPoint[] = withInsights.map((p) => ({
    date: p.scheduled_at?.slice(0, 10) ?? "",
    title: p.title,
    reach: p.reach ?? 0,
    saves: p.saves ?? 0,
    save_rate: p.save_rate,
    home_rate: p.home_rate,
  }));

  return { client, year, month, summary, trend, posts, kpiSaveRateTarget, kpiHomeRateTarget };
}

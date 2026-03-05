import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ clientId: string }> };

function toCsvRow(values: (string | number | null | undefined)[]): string {
  return values
    .map((v) => {
      if (v == null) return "";
      const s = String(v);
      if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    })
    .join(",");
}

function pct(n: number | null): string {
  if (n == null) return "";
  return (n * 100).toFixed(2);
}

export async function GET(req: Request, { params }: Params) {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { clientId } = await params;
  const url = new URL(req.url);
  const year = Number(url.searchParams.get("year") ?? new Date().getFullYear());
  const month = Number(url.searchParams.get("month") ?? new Date().getMonth() + 1);

  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("name")
    .eq("id", clientId)
    .single();

  const startDate = new Date(year, month - 1, 1).toISOString();
  const endDate = new Date(year, month, 1).toISOString();

  const { data: rows } = await supabase
    .from("posts")
    .select(`
      id, title, platform, post_type, status, scheduled_at,
      post_insights(
        reach, saves, follows, follower_reach, non_follower_reach,
        profile_visits, web_taps, discovery, followers_count,
        save_rate, home_rate, profile_visit_rate, follower_conversion_rate,
        genre, theme, target_segment, memo
      )
    `)
    .eq("client_id", clientId)
    .gte("scheduled_at", startDate)
    .lt("scheduled_at", endDate)
    .order("scheduled_at", { ascending: true });

  const header = toCsvRow([
    "投稿タイトル", "プラットフォーム", "種別", "ステータス", "公開日時",
    "リーチ数", "保存数", "フォロー数", "フォロワーリーチ", "フォロワー外リーチ",
    "プロフアクセス", "WEBタップ", "発見", "フォロワー数",
    "保存率(%)", "ホーム率(%)", "プロフ訪問率(%)", "フォロワー転換率(%)",
    "ジャンル", "テーマ", "ターゲット", "メモ",
  ]);

  const dataRows = (rows ?? []).map((p) => {
    const ins = Array.isArray(p.post_insights)
      ? p.post_insights[0] ?? null
      : (p.post_insights as Record<string, unknown> | null);
    return toCsvRow([
      p.title, p.platform, p.post_type, p.status,
      p.scheduled_at ? new Date(p.scheduled_at).toLocaleString("ja") : "",
      ins?.reach ?? "", ins?.saves ?? "", ins?.follows ?? "",
      ins?.follower_reach ?? "", ins?.non_follower_reach ?? "",
      ins?.profile_visits ?? "", ins?.web_taps ?? "", ins?.discovery ?? "",
      ins?.followers_count ?? "",
      pct(ins?.save_rate as number | null),
      pct(ins?.home_rate as number | null),
      pct(ins?.profile_visit_rate as number | null),
      pct(ins?.follower_conversion_rate as number | null),
      ins?.genre ?? "", ins?.theme ?? "", ins?.target_segment ?? "", ins?.memo ?? "",
    ]);
  });

  const csv = [header, ...dataRows].join("\r\n");
  const filename = `${client?.name ?? clientId}_${year}年${month}月_インサイト.csv`;

  return new Response("\uFEFF" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  });
}

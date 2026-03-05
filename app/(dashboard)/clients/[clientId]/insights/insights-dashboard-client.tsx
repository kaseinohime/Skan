"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KpiSummaryCards } from "@/components/insights/kpi-summary-cards";
import { ReachTrendChart } from "@/components/insights/reach-trend-chart";
import { RateTrendChart } from "@/components/insights/rate-trend-chart";
import { PostInsightsTable } from "@/components/insights/post-insights-table";
import { ChevronLeft, ChevronRight, BarChart2 } from "lucide-react";

type Summary = {
  total_reach: number;
  total_saves: number;
  total_follows: number;
  avg_save_rate: number | null;
  avg_home_rate: number | null;
  avg_profile_visit_rate: number | null;
  avg_follower_conversion_rate: number | null;
  post_count: number;
  posts_with_insights_count: number;
};

type TrendPoint = {
  date: string;
  title: string;
  reach: number;
  saves: number;
  follows: number;
  save_rate: number | null;
  home_rate: number | null;
};

type PostRow = {
  id: string;
  title: string;
  status: string;
  post_type: string;
  platform: string;
  scheduled_at: string | null;
  has_insights: boolean;
  reach: number | null;
  saves: number | null;
  save_rate: number | null;
  home_rate: number | null;
  profile_visit_rate: number | null;
  genre: string | null;
  memo: string | null;
};

type ApiResponse = {
  year: number;
  month: number;
  summary: Summary;
  trend: TrendPoint[];
  posts: PostRow[];
};

type Props = {
  clientId: string;
  clientName: string;
  kpiSaveRateTarget: number;
  kpiHomeRateTarget: number;
};

function monthLabel(year: number, month: number) {
  return `${year}年${month}月`;
}

function prevMonth(year: number, month: number) {
  if (month === 1) return { year: year - 1, month: 12 };
  return { year, month: month - 1 };
}

function nextMonth(year: number, month: number) {
  if (month === 12) return { year: year + 1, month: 1 };
  return { year, month: month + 1 };
}

const EMPTY_SUMMARY: Summary = {
  total_reach: 0,
  total_saves: 0,
  total_follows: 0,
  avg_save_rate: null,
  avg_home_rate: null,
  avg_profile_visit_rate: null,
  avg_follower_conversion_rate: null,
  post_count: 0,
  posts_with_insights_count: 0,
};

export function InsightsDashboardClient({
  clientId,
  clientName,
  kpiSaveRateTarget,
  kpiHomeRateTarget,
}: Props) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/clients/${clientId}/insights/summary?year=${year}&month=${month}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled) {
          setData(d ?? null);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [clientId, year, month]);

  const goNext = () => {
    const n = nextMonth(year, month);
    setYear(n.year);
    setMonth(n.month);
  };
  const goPrev = () => {
    const p = prevMonth(year, month);
    setYear(p.year);
    setMonth(p.month);
  };

  const summary = data?.summary ?? EMPTY_SUMMARY;
  const trend = data?.trend ?? [];
  const posts = data?.posts ?? [];

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart2 className="h-6 w-6 text-primary" />
            インサイスダッシュボード
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">{clientName}</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/clients/${clientId}`}>← ワークスペース</Link>
        </Button>
      </div>

      {/* 月選択 */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={goPrev}
          className="rounded border p-1.5 hover:bg-muted transition-colors"
          aria-label="前の月"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="min-w-[120px] text-center font-semibold">
          {monthLabel(year, month)}
        </span>
        <button
          type="button"
          onClick={goNext}
          className="rounded border p-1.5 hover:bg-muted transition-colors"
          aria-label="次の月"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        {loading && (
          <span className="text-xs text-muted-foreground animate-pulse">読み込み中…</span>
        )}
      </div>

      {/* KPIカード */}
      <KpiSummaryCards
        summary={summary}
        kpiSaveRateTarget={kpiSaveRateTarget}
        kpiHomeRateTarget={kpiHomeRateTarget}
      />

      {/* グラフ2枚横並び */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">リーチ・保存数・フォロー数 推移</CardTitle>
            <CardDescription>投稿日ごとの絶対数</CardDescription>
          </CardHeader>
          <CardContent>
            <ReachTrendChart data={trend} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">保存率・ホーム率 推移</CardTitle>
            <CardDescription>目標ラインとの比較</CardDescription>
          </CardHeader>
          <CardContent>
            <RateTrendChart
              data={trend}
              kpiSaveRateTarget={kpiSaveRateTarget}
              kpiHomeRateTarget={kpiHomeRateTarget}
            />
          </CardContent>
        </Card>
      </div>

      {/* 投稿別テーブル */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">投稿別インサイス</CardTitle>
              <CardDescription>
                {summary.posts_with_insights_count > 0
                  ? `${summary.post_count}件中 ${summary.posts_with_insights_count}件 入力済み`
                  : "インサイスを入力した投稿が表示されます"}
              </CardDescription>
            </div>
            {summary.posts_with_insights_count < summary.post_count &&
              summary.post_count > 0 && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  ⚠ 未入力の投稿があります
                </p>
              )}
          </div>
        </CardHeader>
        <CardContent>
          <PostInsightsTable
            posts={posts}
            clientId={clientId}
            kpiSaveRateTarget={kpiSaveRateTarget}
            kpiHomeRateTarget={kpiHomeRateTarget}
          />
        </CardContent>
      </Card>
    </div>
  );
}

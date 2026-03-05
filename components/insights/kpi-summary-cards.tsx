import { formatNum, formatPct, getKpiStatus } from "@/lib/insights/metrics";
import { KpiBadge } from "./kpi-badge";
import { TrendingUp, Eye, Bookmark, UserPlus, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

type Props = {
  summary: Summary;
  kpiSaveRateTarget?: number;
  kpiHomeRateTarget?: number;
};

export function KpiSummaryCards({
  summary,
  kpiSaveRateTarget = 0.02,
  kpiHomeRateTarget = 0.40,
}: Props) {
  const saveStatus = getKpiStatus(summary.avg_save_rate, kpiSaveRateTarget);
  const homeStatus = getKpiStatus(summary.avg_home_rate, kpiHomeRateTarget);

  const cards = [
    {
      label: "月間リーチ",
      value: formatNum(summary.total_reach),
      sub: `保存 ${formatNum(summary.total_saves)} / フォロー ${formatNum(summary.total_follows)}`,
      icon: <Eye className="h-4 w-4" />,
      badge: null,
    },
    {
      label: "平均保存率",
      value: formatPct(summary.avg_save_rate),
      sub: `目標 ${formatPct(kpiSaveRateTarget)}`,
      icon: <Bookmark className="h-4 w-4" />,
      badge: <KpiBadge status={saveStatus} />,
    },
    {
      label: "平均ホーム率",
      value: formatPct(summary.avg_home_rate),
      sub: `目標 ${formatPct(kpiHomeRateTarget)}`,
      icon: <TrendingUp className="h-4 w-4" />,
      badge: <KpiBadge status={homeStatus} />,
    },
    {
      label: "平均プロフ遷移率",
      value: formatPct(summary.avg_profile_visit_rate),
      sub: null,
      icon: <UserPlus className="h-4 w-4" />,
      badge: null,
    },
    {
      label: "投稿数",
      value: String(summary.post_count),
      sub: `インサイス入力済み ${summary.posts_with_insights_count} / ${summary.post_count}`,
      icon: <FileText className="h-4 w-4" />,
      badge: null,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              {c.icon}
              {c.label}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold tabular-nums">{c.value}</p>
              {c.badge}
            </div>
            {c.sub && <p className="text-xs text-muted-foreground">{c.sub}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatNum, formatPct, getKpiStatus } from "@/lib/insights/metrics";
import { KpiBadge } from "./kpi-badge";
import { AlertCircle } from "lucide-react";

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

type Props = {
  posts: PostRow[];
  clientId: string;
  kpiSaveRateTarget?: number;
  kpiHomeRateTarget?: number;
};

export function PostInsightsTable({
  posts,
  clientId,
  kpiSaveRateTarget = 0.02,
  kpiHomeRateTarget = 0.40,
}: Props) {
  if (posts.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        この月の投稿はありません
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs text-muted-foreground">
            <th className="pb-2 pr-4 font-medium">投稿</th>
            <th className="pb-2 pr-4 font-medium">種別</th>
            <th className="pb-2 pr-4 font-medium text-right">リーチ</th>
            <th className="pb-2 pr-4 font-medium text-right">保存数</th>
            <th className="pb-2 pr-4 font-medium text-right">保存率</th>
            <th className="pb-2 pr-4 font-medium text-right">ホーム率</th>
            <th className="pb-2 pr-4 font-medium text-right">プロフ遷移</th>
            <th className="pb-2 font-medium">ジャンル</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {posts.map((p) => (
            <tr key={p.id} className={`${!p.has_insights ? "opacity-50" : ""}`}>
              <td className="py-2.5 pr-4 max-w-[200px]">
                <div className="flex items-center gap-1.5">
                  {!p.has_insights && (
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                  )}
                  <Link
                    href={`/clients/${clientId}/posts/${p.id}/insights`}
                    className="truncate font-medium hover:underline"
                  >
                    {p.title}
                  </Link>
                </div>
                {p.scheduled_at && (
                  <p className="text-xs text-muted-foreground">
                    {new Date(p.scheduled_at).toLocaleDateString("ja")}
                  </p>
                )}
              </td>
              <td className="py-2.5 pr-4">
                <Badge variant="outline" className="text-xs">
                  {p.platform}/{p.post_type}
                </Badge>
              </td>
              <td className="py-2.5 pr-4 text-right tabular-nums">
                {formatNum(p.reach)}
              </td>
              <td className="py-2.5 pr-4 text-right tabular-nums">
                {formatNum(p.saves)}
              </td>
              <td className="py-2.5 pr-4 text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <span className="tabular-nums">{formatPct(p.save_rate)}</span>
                  {p.has_insights && (
                    <KpiBadge status={getKpiStatus(p.save_rate, kpiSaveRateTarget)} />
                  )}
                </div>
              </td>
              <td className="py-2.5 pr-4 text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <span className="tabular-nums">{formatPct(p.home_rate)}</span>
                  {p.has_insights && (
                    <KpiBadge status={getKpiStatus(p.home_rate, kpiHomeRateTarget)} />
                  )}
                </div>
              </td>
              <td className="py-2.5 pr-4 text-right tabular-nums">
                {formatPct(p.profile_visit_rate)}
              </td>
              <td className="py-2.5 text-xs text-muted-foreground">
                {p.genre ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

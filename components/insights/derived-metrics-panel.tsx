"use client";

import { calcDerivedMetrics, getKpiStatus, formatPct, type InsightsRaw } from "@/lib/insights/metrics";
import { KpiBadge } from "./kpi-badge";

type Props = {
  raw: InsightsRaw;
  kpiSaveRateTarget?: number;
  kpiHomeRateTarget?: number;
};

type MetricRow = {
  label: string;
  value: string;
  target?: string;
  status?: ReturnType<typeof getKpiStatus>;
};

export function DerivedMetricsPanel({
  raw,
  kpiSaveRateTarget = 0.02,
  kpiHomeRateTarget = 0.40,
}: Props) {
  const derived = calcDerivedMetrics(raw);

  const rows: MetricRow[] = [
    {
      label: "保存率",
      value: formatPct(derived.save_rate),
      target: `目標 ${formatPct(kpiSaveRateTarget)}`,
      status: getKpiStatus(derived.save_rate, kpiSaveRateTarget),
    },
    {
      label: "ホーム率",
      value: formatPct(derived.home_rate),
      target: `目標 ${formatPct(kpiHomeRateTarget)}`,
      status: getKpiStatus(derived.home_rate, kpiHomeRateTarget),
    },
    {
      label: "プロフ遷移率",
      value: formatPct(derived.profile_visit_rate),
    },
    {
      label: "フォロワー転換率",
      value: formatPct(derived.follower_conversion_rate),
    },
    {
      label: "WEBタップ率",
      value: formatPct(derived.web_tap_rate),
    },
  ];

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        自動計算指標
      </p>
      <div className="divide-y rounded-lg border">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between px-3 py-2.5"
          >
            <div>
              <p className="text-sm font-medium">{row.label}</p>
              {row.target && (
                <p className="text-xs text-muted-foreground">{row.target}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tabular-nums">{row.value}</span>
              {row.status != null && <KpiBadge status={row.status} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

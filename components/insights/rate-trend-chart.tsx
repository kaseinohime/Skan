"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

type TrendPoint = {
  date: string;
  title: string;
  save_rate: number | null;
  home_rate: number | null;
};

type Props = {
  data: TrendPoint[];
  kpiSaveRateTarget?: number;
  kpiHomeRateTarget?: number;
};

function shortDate(dateStr: string): string {
  if (!dateStr) return "";
  const [, m, d] = dateStr.split("-");
  return `${parseInt(m)}/${parseInt(d)}`;
}

function pct(v: number | null): number | null {
  return v == null ? null : parseFloat((v * 100).toFixed(2));
}

export function RateTrendChart({
  data,
  kpiSaveRateTarget = 0.02,
  kpiHomeRateTarget = 0.40,
}: Props) {
  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        この月のデータがありません
      </div>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    label: shortDate(d.date),
    save_rate_pct: pct(d.save_rate),
    home_rate_pct: pct(d.home_rate),
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={44}
          tickFormatter={(v) => `${v}%`}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const d = payload[0].payload as (typeof chartData)[0];
            return (
              <div className="rounded-lg border bg-background p-3 shadow-md text-xs space-y-1 max-w-[200px]">
                <p className="font-semibold truncate">{d.title}</p>
                <p className="text-muted-foreground">{d.date}</p>
                {payload.map((p) => (
                  <p key={p.dataKey} style={{ color: p.color }}>
                    {p.name}: {p.value != null ? `${p.value}%` : "—"}
                  </p>
                ))}
              </div>
            );
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          formatter={(v) =>
            ({ save_rate_pct: "保存率", home_rate_pct: "ホーム率" }[v as string] ?? v)
          }
        />
        {/* 目標ライン */}
        <ReferenceLine
          y={parseFloat((kpiSaveRateTarget * 100).toFixed(2))}
          stroke="#10b981"
          strokeDasharray="4 4"
          strokeWidth={1}
          label={{ value: `保存目標${(kpiSaveRateTarget * 100).toFixed(1)}%`, fontSize: 10, fill: "#10b981", position: "insideTopRight" }}
        />
        <ReferenceLine
          y={parseFloat((kpiHomeRateTarget * 100).toFixed(2))}
          stroke="#6366f1"
          strokeDasharray="4 4"
          strokeWidth={1}
          label={{ value: `ホーム目標${(kpiHomeRateTarget * 100).toFixed(0)}%`, fontSize: 10, fill: "#6366f1", position: "insideTopRight" }}
        />
        <Line
          type="monotone"
          dataKey="save_rate_pct"
          stroke="#10b981"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
          connectNulls
          name="save_rate_pct"
        />
        <Line
          type="monotone"
          dataKey="home_rate_pct"
          stroke="#6366f1"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
          connectNulls
          name="home_rate_pct"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

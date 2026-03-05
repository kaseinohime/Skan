"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type TrendPoint = {
  date: string;
  title: string;
  reach: number;
  saves: number;
  follows: number;
};

type Props = { data: TrendPoint[] };

function shortDate(dateStr: string): string {
  if (!dateStr) return "";
  const [, m, d] = dateStr.split("-");
  return `${parseInt(m)}/${parseInt(d)}`;
}

export function ReachTrendChart({ data }: Props) {
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
          width={48}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const d = payload[0].payload as TrendPoint & { label: string };
            return (
              <div className="rounded-lg border bg-background p-3 shadow-md text-xs space-y-1 max-w-[200px]">
                <p className="font-semibold truncate">{d.title}</p>
                <p className="text-muted-foreground">{d.date}</p>
                {payload.map((p) => (
                  <p key={p.dataKey} style={{ color: p.color }}>
                    {p.name}: {(p.value as number).toLocaleString("ja")}
                  </p>
                ))}
              </div>
            );
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          formatter={(v) => ({ reach: "リーチ", saves: "保存数", follows: "フォロー数" }[v as string] ?? v)}
        />
        <Line
          type="monotone"
          dataKey="reach"
          stroke="#6366f1"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
          name="reach"
        />
        <Line
          type="monotone"
          dataKey="saves"
          stroke="#10b981"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
          name="saves"
        />
        <Line
          type="monotone"
          dataKey="follows"
          stroke="#f59e0b"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
          name="follows"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

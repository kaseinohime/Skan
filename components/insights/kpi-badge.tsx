import type { KpiStatus } from "@/lib/insights/metrics";

const config: Record<KpiStatus, { label: string; className: string }> = {
  good: {
    label: "達成",
    className: "bg-emerald-100 text-emerald-700 border border-emerald-300",
  },
  warning: {
    label: "あと少し",
    className: "bg-amber-100 text-amber-700 border border-amber-300",
  },
  poor: {
    label: "要改善",
    className: "bg-red-100 text-red-700 border border-red-300",
  },
  no_data: {
    label: "未入力",
    className: "bg-muted text-muted-foreground border border-border",
  },
};

export function KpiBadge({ status }: { status: KpiStatus }) {
  const { label, className } = config[status];
  return (
    <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

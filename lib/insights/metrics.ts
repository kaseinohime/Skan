export type InsightsRaw = {
  followers_count: number | null;
  reach: number | null;
  saves: number | null;
  follower_reach: number | null;
  non_follower_reach: number | null;
  profile_visits: number | null;
  follows: number | null;
  web_taps: number | null;
  discovery: number | null;
};

export type DerivedMetrics = {
  save_rate: number | null;
  home_rate: number | null;
  profile_visit_rate: number | null;
  follower_conversion_rate: number | null;
  web_tap_rate: number | null;
};

/** 0割り回避の除算。どちらかが null または分母が 0 なら null */
function divide(numerator: number | null, denominator: number | null): number | null {
  if (numerator == null || denominator == null || denominator === 0) return null;
  return numerator / denominator;
}

export function calcDerivedMetrics(raw: InsightsRaw): DerivedMetrics {
  return {
    save_rate: divide(raw.saves, raw.reach),
    home_rate: divide(raw.follower_reach, raw.followers_count),
    profile_visit_rate: divide(raw.profile_visits, raw.reach),
    follower_conversion_rate: divide(raw.follows, raw.profile_visits),
    web_tap_rate: divide(raw.web_taps, raw.reach),
  };
}

export type KpiStatus = "good" | "warning" | "poor" | "no_data";

/**
 * KPI達成度を判定する。
 * good: 目標以上、warning: 目標の80%以上、poor: それ未満
 */
export function getKpiStatus(
  value: number | null,
  target: number,
  warningThreshold = 0.8
): KpiStatus {
  if (value == null) return "no_data";
  if (value >= target) return "good";
  if (value >= target * warningThreshold) return "warning";
  return "poor";
}

export function formatPct(value: number | null, digits = 1): string {
  if (value == null) return "—";
  return `${(value * 100).toFixed(digits)}%`;
}

export function formatNum(value: number | null): string {
  if (value == null) return "—";
  return value.toLocaleString("ja");
}

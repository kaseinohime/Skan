import type { SupabaseClient } from "@supabase/supabase-js";

export type AiUsageType = "caption" | "hashtag" | "insights_suggest";

/** デフォルト値（org設定が取得できない場合のフォールバック） */
export const AI_HOURLY_LIMITS = {
  caption: 10,
  hashtag: 10,
  insights_suggest: 10,
} as const satisfies Record<AiUsageType, number>;

/** 過去 windowHours 時間のローリングウィンドウを返す */
export function rollingWindow(windowHours: number): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getTime() - windowHours * 60 * 60 * 1000);
  return { start: start.toISOString(), end: now.toISOString() };
}

/** 後方互換 */
export const currentHourWindow = () => rollingWindow(1);

/**
 * ユーザーが所属する組織のAI制限設定を取得する。
 * 組織が見つからない場合はデフォルト値を返す。
 */
export async function getOrgRateLimit(
  supabase: SupabaseClient,
  userId: string
): Promise<{ windowHours: number; limitPerWindow: number }> {
  const { data: member } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (!member) return { windowHours: 1, limitPerWindow: 10 };

  const { data: org } = await supabase
    .from("organizations")
    .select("ai_window_hours, ai_limit_per_window")
    .eq("id", member.organization_id)
    .single();

  return {
    windowHours: org?.ai_window_hours ?? 1,
    limitPerWindow: org?.ai_limit_per_window ?? 10,
  };
}

/**
 * プランのプリセット設定。
 * ai_window_hours=720 は「30日（月次）」に相当。
 * ai_limit_per_window=0 は無制限扱い（アプリ側でチェックをスキップ）。
 * client_limit=null は無制限。
 */
export const PLAN_PRESETS = {
  free:       { ai_window_hours: 720, ai_limit_per_window: 5,   client_limit: 1 },
  starter:    { ai_window_hours: 720, ai_limit_per_window: 50,  client_limit: 10 },
  standard:   { ai_window_hours: 720, ai_limit_per_window: 200, client_limit: 30 },
  pro:        { ai_window_hours: 720, ai_limit_per_window: 0,   client_limit: 100 },
  enterprise: { ai_window_hours: 720, ai_limit_per_window: 0,   client_limit: null },
  custom:     null, // 手動入力
} as const;

export type SubscriptionPlan = keyof typeof PLAN_PRESETS;

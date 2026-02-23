/**
 * アプリ共通定数
 */

export const APP_NAME = "エスカン";

export const POST_STATUS_LABELS: Record<string, string> = {
  draft: "未着手",
  in_progress: "制作中",
  pending_review: "承認待ち",
  revision: "修正中",
  approved: "承認済み",
  scheduled: "予約済み",
  published: "投稿完了",
} as const;

import OpenAI from "openai";

export type SuggestionCategory = "caption" | "visual" | "timing" | "hashtag" | "strategy";
export type SuggestionPriority = "high" | "medium" | "low";

export type Suggestion = {
  category: SuggestionCategory;
  title: string;
  body: string;
  priority: SuggestionPriority;
};

export type InsightsSuggestParams = {
  postTitle: string;
  platform: string;
  postType: string;
  insights: {
    reach: number | null;
    saves: number | null;
    follower_reach: number | null;
    followers_count: number | null;
    profile_visits: number | null;
    follows: number | null;
    web_taps: number | null;
    discovery: number | null;
    save_rate: number | null;
    home_rate: number | null;
    profile_visit_rate: number | null;
    follower_conversion_rate: number | null;
    target_segment: string | null;
    genre: string | null;
    theme: string | null;
    memo: string | null;
  };
  kpiSaveRateTarget: number;
  kpiHomeRateTarget: number;
};


const SYSTEM_PROMPT = `あなたはInstagram/TikTokのSNS運用の専門家です。
投稿のインサイト数値を分析し、次回以降の改善提案を3つ出力してください。

## 出力形式
以下のJSON形式のみで出力し、余計な説明は不要です:
{"suggestions": [
  {"category": "caption|visual|timing|hashtag|strategy", "title": "見出し（20文字以内）", "body": "具体的な改善提案（100〜150文字）", "priority": "high|medium|low"}
]}

## 注意事項
- 数値に基づいた具体的な指摘をすること
- KPI目標（保存率・ホーム率）と実績を比較した分析を含めること
- 抽象的なアドバイスは避け、「○○の部分を△△に変更する」レベルの具体性で
- 日本語で出力すること`;

export async function generateInsightsSuggestions(
  params: InsightsSuggestParams
): Promise<Suggestion[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY が設定されていません");

  const client = new OpenAI({ apiKey });

  const pct = (v: number | null) =>
    v != null ? `${(v * 100).toFixed(1)}%` : "未計測";
  const num = (v: number | null) =>
    v != null ? v.toLocaleString("ja") : "未計測";

  const userContent = `
投稿情報:
- タイトル: ${params.postTitle}
- プラットフォーム: ${params.platform}
- 種別: ${params.postType}
- ジャンル: ${params.insights.genre ?? "未設定"}
- テーマ: ${params.insights.theme ?? "未設定"}
- ターゲット: ${params.insights.target_segment ?? "未設定"}

インサイト数値:
- リーチ数: ${num(params.insights.reach)}
- 保存数: ${num(params.insights.saves)}
- フォロワーリーチ: ${num(params.insights.follower_reach)}
- フォロワー数: ${num(params.insights.followers_count)}
- プロフアクセス: ${num(params.insights.profile_visits)}
- フォロー数: ${num(params.insights.follows)}
- 発見経由: ${num(params.insights.discovery)}

KPI達成状況:
- 保存率: ${pct(params.insights.save_rate)}（目標 ${pct(params.kpiSaveRateTarget)}）
- ホーム率: ${pct(params.insights.home_rate)}（目標 ${pct(params.kpiHomeRateTarget)}）
- プロフ遷移率: ${pct(params.insights.profile_visit_rate)}
- フォロワー転換率: ${pct(params.insights.follower_conversion_rate)}

メモ: ${params.insights.memo ?? "なし"}
`.trim();

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
  });

  const content = response.choices[0]?.message?.content?.trim();
  if (!content) throw new Error("AI から応答がありませんでした");

  const parsed = JSON.parse(content) as { suggestions?: unknown };
  if (!Array.isArray(parsed?.suggestions) || parsed.suggestions.length === 0) {
    throw new Error("改善提案を取得できませんでした");
  }
  return (parsed.suggestions as Suggestion[]).slice(0, 3);
}

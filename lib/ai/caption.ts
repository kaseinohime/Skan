import OpenAI from "openai";

const CAPTION_DAILY_LIMIT = 30;
const HASHTAG_DAILY_LIMIT = 50;

const systemPrompt = `あなたはSNS運用のコピーライターです。指定された条件に沿って、InstagramまたはTikTok向けの投稿キャプションを3パターン作成してください。
- 各案は200文字以内で、改行は必要に応じて入れてください。
- プラットフォームの特性（Instagramは写真・ストーリー向け、TikTokは動画・短尺向け）を考慮してください。
- 出力は必ず以下のJSON形式のみにしてください。余計な説明は不要です。
{"options": ["案1のキャプション本文", "案2のキャプション本文", "案3のキャプション本文"]}`;

const hashtagSystemPrompt = `あなたはSNS運用の専門家です。与えられたキャプションの内容に合ったハッシュタグを提案してください。
- 日本語・英語のハッシュタグを混ぜて、10個以内で提案してください。
- #は付けずにキーワードのみをカンマ区切りで出力してください。
- 例: ファッション, コーデ, ootd, 春コーデ, 日常
出力はカンマ区切りのキーワードのみにしてください。`;

export type CaptionGenerateParams = {
  theme: string;
  targetAudience?: string;
  tone: string;
  postType: string;
  platform: string;
  referenceText?: string;
};

export async function generateCaptionOptions(
  params: CaptionGenerateParams
): Promise<string[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY が設定されていません");
  }

  const client = new OpenAI({ apiKey });
  const userContent = [
    `テーマ: ${params.theme}`,
    params.targetAudience ? `ターゲット: ${params.targetAudience}` : null,
    `トーン: ${params.tone}`,
    `投稿種別: ${params.postType}`,
    `プラットフォーム: ${params.platform}`,
    params.referenceText ? `参考にするテキスト:\n${params.referenceText}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
  });

  const content = response.choices[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("AI から応答がありませんでした");
  }

  const parsed = JSON.parse(content) as { options?: unknown };
  const options = Array.isArray(parsed?.options)
    ? (parsed.options as string[]).slice(0, 3)
    : [];
  if (options.length === 0) {
    throw new Error("キャプション案を取得できませんでした");
  }
  return options;
}

export async function suggestHashtags(caption: string): Promise<string[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY が設定されていません");
  }

  const client = new OpenAI({ apiKey });
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: hashtagSystemPrompt },
      { role: "user", content: caption || "投稿のテーマや雰囲気に合うハッシュタグを提案してください。" },
    ],
    temperature: 0.5,
  });

  const content = response.choices[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("AI から応答がありませんでした");
  }

  const keywords = content
    .split(/[,、\s]+/)
    .map((s) => s.trim().replace(/^#/, ""))
    .filter(Boolean);
  return [...new Set(keywords)].slice(0, 15);
}

// 後方互換のため残す（内部では rate-limit.ts の AI_HOURLY_LIMITS を使用）
export const AI_LIMITS = {
  caption: CAPTION_DAILY_LIMIT,
  hashtag: HASHTAG_DAILY_LIMIT,
} as const;

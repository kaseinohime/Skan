import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { NextResponse } from "next/server";
import {
  generateCaptionOptions,
  AI_LIMITS,
  type CaptionGenerateParams,
} from "@/lib/ai/caption";

function todayUTC(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}
function todayStartEnd(): { start: string; end: string } {
  const s = todayUTC();
  const next = new Date(s + "T00:00:00.000Z");
  next.setUTCDate(next.getUTCDate() + 1);
  const e = next.toISOString().slice(0, 19) + "Z";
  return { start: `${s}T00:00:00.000Z`, end: e };
}

export async function POST(request: Request) {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "ログインしてください。" } },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "JSON を解析できません。" } },
      { status: 400 }
    );
  }

  const theme =
    typeof body === "object" &&
    body !== null &&
    "theme" in body &&
    typeof (body as { theme: unknown }).theme === "string"
      ? (body as { theme: string }).theme.trim()
      : "";
  const targetAudience =
    typeof body === "object" &&
    body !== null &&
    "targetAudience" in body &&
    typeof (body as { targetAudience: unknown }).targetAudience === "string"
      ? (body as { targetAudience: string }).targetAudience.trim() || undefined
      : undefined;
  const tone =
    typeof body === "object" &&
    body !== null &&
    "tone" in body &&
    typeof (body as { tone: unknown }).tone === "string"
      ? (body as { tone: string }).tone.trim()
      : "カジュアル";
  const postType =
    typeof body === "object" &&
    body !== null &&
    "postType" in body &&
    typeof (body as { postType: unknown }).postType === "string"
      ? (body as { postType: string }).postType
      : "feed";
  const platform =
    typeof body === "object" &&
    body !== null &&
    "platform" in body &&
    typeof (body as { platform: unknown }).platform === "string"
      ? (body as { platform: string }).platform
      : "instagram";
  const referenceText =
    typeof body === "object" &&
    body !== null &&
    "referenceText" in body &&
    typeof (body as { referenceText: unknown }).referenceText === "string"
      ? (body as { referenceText: string }).referenceText.trim() || undefined
      : undefined;

  if (!theme) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "テーマを入力してください。" } },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { start, end } = todayStartEnd();

  const { count } = await supabase
    .from("ai_usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("usage_type", "caption")
    .gte("created_at", start)
    .lt("created_at", end);

  const used = count ?? 0;
  if (used >= AI_LIMITS.caption) {
    return NextResponse.json(
      {
        error: {
          code: "RATE_LIMIT",
          message: `本日のキャプション生成回数の上限（${AI_LIMITS.caption}回）に達しました。明日またお試しください。`,
        },
      },
      { status: 429 }
    );
  }

  try {
    const options = await generateCaptionOptions({
      theme,
      targetAudience,
      tone,
      postType,
      platform,
      referenceText,
    } as CaptionGenerateParams);

    await supabase.from("ai_usage").insert({
      user_id: user.id,
      usage_type: "caption",
    });

    return NextResponse.json({ options });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "キャプションの生成に失敗しました。";
    return NextResponse.json(
      { error: { code: "AI_ERROR", message } },
      { status: 502 }
    );
  }
}

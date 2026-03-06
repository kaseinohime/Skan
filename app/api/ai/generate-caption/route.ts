import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { NextResponse } from "next/server";
import {
  generateCaptionOptions,
  type CaptionGenerateParams,
} from "@/lib/ai/caption";
import { getOrgRateLimit, rollingWindow } from "@/lib/ai/rate-limit";

export async function POST(req: Request) {
  const request = req;
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
  const { windowHours, limitPerWindow } = await getOrgRateLimit(supabase, user.id);
  const { start, end } = rollingWindow(windowHours);

  const { count } = await supabase
    .from("ai_usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("usage_type", "caption")
    .gte("created_at", start)
    .lt("created_at", end);

  // limitPerWindow === 0 は無制限扱いでスキップ
  if (limitPerWindow > 0 && (count ?? 0) >= limitPerWindow) {
    return NextResponse.json(
      {
        error: {
          code: "RATE_LIMIT",
          message: `${windowHours}時間あたりのキャプション生成回数の上限（${limitPerWindow}回）に達しました。しばらくしてからお試しください。`,
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

    await logAudit({
      actorId: user.id,
      actorEmail: user.email,
      action: "AIキャプションを生成",
      entityType: "ai",
      metadata: { ai_type: "caption", platform, postType, tone },
      request,
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

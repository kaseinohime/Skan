import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { NextResponse } from "next/server";
import { suggestHashtags } from "@/lib/ai/caption";
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

  const caption =
    typeof body === "object" &&
    body !== null &&
    "caption" in body &&
    typeof (body as { caption: unknown }).caption === "string"
      ? (body as { caption: string }).caption
      : "";

  const supabase = await createClient();
  const { windowHours, limitPerWindow } = await getOrgRateLimit(supabase, user.id);
  const { start, end } = rollingWindow(windowHours);

  const { count } = await supabase
    .from("ai_usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("usage_type", "hashtag")
    .gte("created_at", start)
    .lt("created_at", end);

  // limitPerWindow === 0 は無制限扱いでスキップ
  if (limitPerWindow > 0 && (count ?? 0) >= limitPerWindow) {
    return NextResponse.json(
      {
        error: {
          code: "RATE_LIMIT",
          message: `${windowHours}時間あたりのハッシュタグ提案回数の上限（${limitPerWindow}回）に達しました。しばらくしてからお試しください。`,
        },
      },
      { status: 429 }
    );
  }

  try {
    const hashtags = await suggestHashtags(caption);

    await supabase.from("ai_usage").insert({
      user_id: user.id,
      usage_type: "hashtag",
    });

    await logAudit({
      actorId: user.id,
      actorEmail: user.email,
      action: "AIハッシュタグを提案",
      entityType: "ai",
      metadata: { ai_type: "hashtag" },
      request,
    });

    return NextResponse.json({ hashtags });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "ハッシュタグの提案に失敗しました。";
    return NextResponse.json(
      { error: { code: "AI_ERROR", message } },
      { status: 502 }
    );
  }
}

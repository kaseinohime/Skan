import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { suggestHashtags, AI_LIMITS } from "@/lib/ai/caption";

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

  const caption =
    typeof body === "object" &&
    body !== null &&
    "caption" in body &&
    typeof (body as { caption: unknown }).caption === "string"
      ? (body as { caption: string }).caption
      : "";

  const supabase = await createClient();
  const { start, end } = todayStartEnd();

  const { count } = await supabase
    .from("ai_usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("usage_type", "hashtag")
    .gte("created_at", start)
    .lt("created_at", end);

  const used = count ?? 0;
  if (used >= AI_LIMITS.hashtag) {
    return NextResponse.json(
      {
        error: {
          code: "RATE_LIMIT",
          message: `本日のハッシュタグ提案回数の上限（${AI_LIMITS.hashtag}回）に達しました。明日またお試しください。`,
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

import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { upsertInsightsSchema } from "@/lib/validations/insights";
import { calcDerivedMetrics } from "@/lib/insights/metrics";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ clientId: string; postId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "ログインしてください。" } },
      { status: 401 }
    );
  }

  const { postId } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("post_insights")
    .select("*")
    .eq("post_id", postId)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ insights: data ?? null });
}

export async function POST(request: Request, { params }: Params) {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "ログインしてください。" } },
      { status: 401 }
    );
  }
  if (user.system_role === "client") {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "インサイトの入力は代理店スタッフのみ可能です。" } },
      { status: 403 }
    );
  }

  const { clientId, postId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "JSON を解析できません。" } },
      { status: 400 }
    );
  }

  const parsed = upsertInsightsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "入力内容を確認してください。" } },
      { status: 400 }
    );
  }

  const derived = calcDerivedMetrics({
    followers_count: parsed.data.followers_count ?? null,
    reach: parsed.data.reach ?? null,
    saves: parsed.data.saves ?? null,
    follower_reach: parsed.data.follower_reach ?? null,
    non_follower_reach: parsed.data.non_follower_reach ?? null,
    profile_visits: parsed.data.profile_visits ?? null,
    follows: parsed.data.follows ?? null,
    web_taps: parsed.data.web_taps ?? null,
    discovery: parsed.data.discovery ?? null,
  });

  const supabase = await createClient();

  // post_id がユニーク制約 → upsert で作成 or 更新
  const { data, error } = await supabase
    .from("post_insights")
    .upsert(
      {
        post_id: postId,
        client_id: clientId,
        ...parsed.data,
        ...derived,
        recorded_by: user.id,
        recorded_at: new Date().toISOString(),
      },
      { onConflict: "post_id" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ insights: data }, { status: 201 });
}

export async function PATCH(request: Request, { params }: Params) {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "ログインしてください。" } },
      { status: 401 }
    );
  }
  if (user.system_role === "client") {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "インサイトの編集は代理店スタッフのみ可能です。" } },
      { status: 403 }
    );
  }

  const { clientId, postId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "JSON を解析できません。" } },
      { status: 400 }
    );
  }

  const parsed = upsertInsightsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "入力内容を確認してください。" } },
      { status: 400 }
    );
  }

  // 既存レコードを取得して派生指標を再計算
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("post_insights")
    .select("*")
    .eq("post_id", postId)
    .maybeSingle();

  const merged = { ...(existing ?? {}), ...parsed.data };
  const derived = calcDerivedMetrics({
    followers_count: merged.followers_count ?? null,
    reach: merged.reach ?? null,
    saves: merged.saves ?? null,
    follower_reach: merged.follower_reach ?? null,
    non_follower_reach: merged.non_follower_reach ?? null,
    profile_visits: merged.profile_visits ?? null,
    follows: merged.follows ?? null,
    web_taps: merged.web_taps ?? null,
    discovery: merged.discovery ?? null,
  });

  const { data, error } = await supabase
    .from("post_insights")
    .upsert(
      {
        post_id: postId,
        client_id: clientId,
        ...merged,
        ...derived,
        recorded_by: user.id,
        recorded_at: new Date().toISOString(),
      },
      { onConflict: "post_id" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ insights: data });
}

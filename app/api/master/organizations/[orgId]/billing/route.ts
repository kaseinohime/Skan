import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { NextResponse } from "next/server";
import { PLAN_PRESETS, type SubscriptionPlan } from "@/lib/ai/rate-limit";

type Params = { params: Promise<{ orgId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const user = await requireRole(["master"]);
  if (!user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "権限がありません。" } },
      { status: 403 }
    );
  }

  const { orgId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "JSON を解析できません。" } },
      { status: 400 }
    );
  }

  const b = body as Record<string, unknown>;
  const plan = b.subscription_plan as SubscriptionPlan | undefined;

  if (!plan || !(plan in PLAN_PRESETS)) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "subscription_plan が不正です。" } },
      { status: 400 }
    );
  }

  let updates: Record<string, unknown> = { subscription_plan: plan };

  if (plan !== "custom") {
    // プリセット値を適用（マスターによる手動変更 / Stripe請求には影響しない）
    const preset = PLAN_PRESETS[plan]!;
    updates = {
      ...updates,
      ai_window_hours: preset.ai_window_hours,
      ai_limit_per_window: preset.ai_limit_per_window,
      client_limit: preset.client_limit,
    };
  } else {
    // カスタム: 手動値をバリデーション
    const windowHours = Number(b.ai_window_hours);
    const limitPerWindow = Number(b.ai_limit_per_window);
    const clientLimit = b.client_limit === null ? null : Number(b.client_limit);

    if (!Number.isInteger(windowHours) || windowHours < 1 || windowHours > 720) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "ai_window_hours は 1〜720 の整数で入力してください。" } },
        { status: 400 }
      );
    }
    if (!Number.isInteger(limitPerWindow) || limitPerWindow < 0) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "ai_limit_per_window は 0 以上の整数で入力してください。" } },
        { status: 400 }
      );
    }
    if (clientLimit !== null && (!Number.isInteger(clientLimit) || clientLimit < 0)) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "client_limit は 0 以上の整数または null で入力してください。" } },
        { status: 400 }
      );
    }

    updates = {
      ...updates,
      ai_window_hours: windowHours,
      ai_limit_per_window: limitPerWindow,
      client_limit: clientLimit,
    };
  }

  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("name, subscription_plan")
    .eq("id", orgId)
    .single();

  const { error } = await supabase
    .from("organizations")
    .update(updates)
    .eq("id", orgId);

  if (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: error.message } },
      { status: 500 }
    );
  }

  await logAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: "プランを変更",
    entityType: "billing",
    entityId: orgId,
    entityLabel: org?.name ?? orgId,
    organizationId: orgId,
    organizationName: org?.name,
    metadata: { from: org?.subscription_plan, to: plan, updates },
  });

  return NextResponse.json({ success: true, updates });
}

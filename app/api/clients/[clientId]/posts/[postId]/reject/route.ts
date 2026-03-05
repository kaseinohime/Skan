import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * 差し戻し実行。コメントを付けて revision にし、承認ステップをリセットする。
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ clientId: string; postId: string }> }
) {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "ログインしてください。" } },
      { status: 401 }
    );
  }

  const { clientId, postId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const comment =
    typeof body === "object" && body !== null && "comment" in body && typeof (body as { comment: unknown }).comment === "string"
      ? (body as { comment: string }).comment.trim()
      : null;

  const supabase = await createClient();

  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("id, client_id, status, current_approval_step, title, assigned_to, created_by")
    .eq("id", postId)
    .eq("client_id", clientId)
    .single();

  if (postError || !post) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "投稿が見つかりません。" } },
      { status: 404 }
    );
  }

  if (post.status !== "pending_review") {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "承認待ちの投稿のみ差し戻しできます。" } },
      { status: 400 }
    );
  }

  const { data: client } = await supabase
    .from("clients")
    .select("organization_id")
    .eq("id", post.client_id)
    .single();

  if (!client?.organization_id) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "クライアントの組織を取得できません。" } },
      { status: 500 }
    );
  }

  const { data: template } = await supabase
    .from("approval_templates")
    .select("id")
    .eq("organization_id", client.organization_id)
    .eq("is_default", true)
    .limit(1)
    .maybeSingle();

  if (!template) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "承認フローのデフォルトテンプレートが設定されていません。" } },
      { status: 400 }
    );
  }

  const { data: steps } = await supabase
    .from("approval_steps")
    .select("id, step_order, name, required_role, assigned_to")
    .eq("template_id", template.id)
    .order("step_order", { ascending: true });

  const stepsList = steps ?? [];
  const currentStepIndex = Math.max(0, post.current_approval_step);
  const currentStep = stepsList[currentStepIndex];

  if (!currentStep) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "承認ステップが見つかりません。" } },
      { status: 400 }
    );
  }

  let canAct = false;
  if (currentStep.assigned_to) {
    canAct = currentStep.assigned_to === user.id;
  } else {
    if (currentStep.required_role === "agency_admin") {
      const { data: om } = await supabase
        .from("organization_members")
        .select("id")
        .eq("organization_id", client.organization_id)
        .eq("user_id", user.id)
        .eq("role", "agency_admin")
        .eq("is_active", true)
        .maybeSingle();
      canAct = !!om;
    } else if (currentStep.required_role === "client") {
      const { data: cm } = await supabase
        .from("client_members")
        .select("id")
        .eq("client_id", post.client_id)
        .eq("user_id", user.id)
        .eq("role", "client")
        .eq("is_active", true)
        .maybeSingle();
      canAct = !!cm;
    } else {
      const { data: cm } = await supabase
        .from("client_members")
        .select("id")
        .eq("client_id", post.client_id)
        .eq("user_id", user.id)
        .eq("role", "staff")
        .eq("is_active", true)
        .maybeSingle();
      const { data: om } = await supabase
        .from("organization_members")
        .select("id")
        .eq("organization_id", client.organization_id)
        .eq("user_id", user.id)
        .eq("role", "staff")
        .eq("is_active", true)
        .maybeSingle();
      canAct = !!cm || !!om;
    }
  }

  if (user.system_role === "master") canAct = true;

  if (!canAct) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "このステップを差し戻す権限がありません。" } },
      { status: 403 }
    );
  }

  const { error: logError } = await supabase.from("approval_logs").insert({
    post_id: postId,
    step_order: currentStep.step_order,
    step_name: currentStep.name,
    action: "rejected",
    comment: comment ?? undefined,
    acted_by: user.id,
  });

  if (logError) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: logError.message } },
      { status: 500 }
    );
  }

  const { error: updateError } = await supabase
    .from("posts")
    .update({ status: "revision", current_approval_step: 0 })
    .eq("id", postId)
    .eq("client_id", clientId);

  if (updateError) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: updateError.message } },
      { status: 500 }
    );
  }

  const notifyUserId = post.assigned_to ?? post.created_by;
  if (notifyUserId) {
    await supabase.rpc("create_notification", {
      p_user_id: notifyUserId,
      p_title: "投稿が差し戻されました",
      p_body: comment ? `「${post.title}」が差し戻されました: ${comment}` : `「${post.title}」が差し戻されました。`,
      p_type: "approval_result",
      p_reference_type: "post",
      p_reference_id: postId,
    });
  }

  return NextResponse.json({ ok: true, status: "revision" });
}

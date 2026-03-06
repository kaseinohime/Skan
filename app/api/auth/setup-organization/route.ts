import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** 会社名からURLスラッグを生成 */
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 40) || "org";
}

/** スラッグの重複を避けるためサフィックスを付ける */
async function uniqueSlug(admin: ReturnType<typeof createAdminClient>, base: string): Promise<string> {
  let slug = base;
  let i = 2;
  while (true) {
    const { data } = await admin.from("organizations").select("id").eq("slug", slug).maybeSingle();
    if (!data) return slug;
    slug = `${base}-${i++}`;
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  // ボディに org_name がなければユーザーメタデータから取得（メール確認後のフロー）
  const orgName =
    (typeof body.org_name === "string" ? body.org_name.trim() : "") ||
    (typeof user.user_metadata?.org_name === "string" ? user.user_metadata.org_name.trim() : "");

  if (!orgName) {
    return NextResponse.json({ error: "会社名・組織名を入力してください" }, { status: 400 });
  }

  const admin = createAdminClient();

  // すでに組織を持っていれば重複作成しない
  const { data: existing } = await admin
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .eq("role", "agency_admin")
    .eq("is_active", true)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ ok: true, organization_id: existing.organization_id });
  }

  const slug = await uniqueSlug(admin, toSlug(orgName));

  // 組織作成
  const { data: org, error: orgError } = await admin
    .from("organizations")
    .insert({
      name: orgName,
      slug,
      created_by: user.id,
      subscription_plan: "free",
      subscription_status: "active",
      ai_window_hours: 720,
      ai_limit_per_window: 5,
      client_limit: 1,
    })
    .select("id")
    .single();

  if (orgError || !org) {
    return NextResponse.json({ error: orgError?.message ?? "組織作成に失敗しました" }, { status: 500 });
  }

  // 作成者をagency_adminとして追加
  await admin.from("organization_members").insert({
    organization_id: org.id,
    user_id: user.id,
    role: "agency_admin",
    joined_at: new Date().toISOString(),
  });

  // system_roleをagency_adminに更新（まだstaffなら）
  await admin
    .from("users")
    .update({ system_role: "agency_admin" })
    .eq("id", user.id)
    .neq("system_role", "master");

  // デフォルト承認フローテンプレートを作成
  const { data: template } = await admin
    .from("approval_templates")
    .insert({
      organization_id: org.id,
      name: "デフォルト承認フロー",
      is_default: true,
    })
    .select("id")
    .single();

  if (template) {
    await admin.from("approval_steps").insert({
      template_id: template.id,
      step_order: 1,
      name: "企業管理者確認",
      required_role: "agency_admin",
    });
  }

  return NextResponse.json({ ok: true, organization_id: org.id });
}

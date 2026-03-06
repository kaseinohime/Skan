import { createAdminClient } from "@/lib/supabase/admin";

function toSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/[\s_]+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 40) || "org"
  );
}

async function uniqueSlug(
  admin: ReturnType<typeof createAdminClient>,
  base: string
): Promise<string> {
  let slug = base;
  let i = 2;
  while (true) {
    const { data } = await admin
      .from("organizations")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!data) return slug;
    slug = `${base}-${i++}`;
  }
}

/**
 * ユーザーの組織をセットアップする。
 * セッション有無に関わらず admin クライアントで処理するため確実に動作する。
 * 冪等: 既に組織を持っている場合はそのIDを返す。
 */
export async function ensureOrganization(
  userId: string,
  orgName: string
): Promise<{ ok: true; organization_id: string } | { ok: false; error: string }> {
  if (!orgName.trim()) {
    return { ok: false, error: "組織名が指定されていません" };
  }

  const admin = createAdminClient();

  // 既存チェック
  const { data: existing } = await admin
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .eq("role", "agency_admin")
    .eq("is_active", true)
    .maybeSingle();

  if (existing) {
    return { ok: true, organization_id: existing.organization_id };
  }

  const slug = await uniqueSlug(admin, toSlug(orgName.trim()));

  // 組織作成
  const { data: org, error: orgError } = await admin
    .from("organizations")
    .insert({
      name: orgName.trim(),
      slug,
      created_by: userId,
      subscription_plan: "free",
      subscription_status: "active",
      ai_window_hours: 720,
      ai_limit_per_window: 5,
      client_limit: 1,
    })
    .select("id")
    .single();

  if (orgError || !org) {
    return { ok: false, error: orgError?.message ?? "組織作成に失敗しました" };
  }

  // メンバーとして追加
  const { error: memberError } = await admin.from("organization_members").insert({
    organization_id: org.id,
    user_id: userId,
    role: "agency_admin",
    joined_at: new Date().toISOString(),
  });

  if (memberError) {
    // 組織だけ作成されてメンバーが入らない状態を防ぐため組織を削除
    await admin.from("organizations").delete().eq("id", org.id);
    return { ok: false, error: memberError.message };
  }

  // system_role を agency_admin に更新
  await admin
    .from("users")
    .update({ system_role: "agency_admin" })
    .eq("id", userId)
    .neq("system_role", "master");

  // デフォルト承認フロー
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

  return { ok: true, organization_id: org.id };
}

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

/**
 * 招待フロー完了処理:
 * - organization_invitations / client_invitations を確認
 * - organization_members / client_members に追加
 * - users.system_role を更新
 * - 招待レコードを削除
 */
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
  }

  const admin = createAdminClient();
  let highestRole: "agency_admin" | "staff" | "client" | null = null;

  // --- 組織招待の処理 ---
  const { data: orgInvitations } = await admin
    .from("organization_invitations")
    .select("*")
    .eq("email", user.email);

  for (const inv of orgInvitations ?? []) {
    // 既存メンバーでなければ追加
    const { data: existing } = await admin
      .from("organization_members")
      .select("id")
      .eq("organization_id", inv.organization_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!existing) {
      await admin.from("organization_members").insert({
        organization_id: inv.organization_id,
        user_id: user.id,
        role: inv.role,
        joined_at: new Date().toISOString(),
      });
    }

    // ロール優先度: agency_admin > staff
    if (inv.role === "agency_admin") highestRole = "agency_admin";
    else if (!highestRole) highestRole = "staff";

    // 招待レコードを削除
    await admin
      .from("organization_invitations")
      .delete()
      .eq("id", inv.id);
  }

  // --- クライアント招待の処理 ---
  const { data: clientInvitations } = await admin
    .from("client_invitations")
    .select("*")
    .eq("email", user.email);

  for (const inv of clientInvitations ?? []) {
    const { data: existing } = await admin
      .from("client_members")
      .select("id")
      .eq("client_id", inv.client_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!existing) {
      await admin.from("client_members").insert({
        client_id: inv.client_id,
        user_id: user.id,
        role: inv.role,
        joined_at: new Date().toISOString(),
      });
    }

    if (!highestRole) highestRole = "client";

    await admin
      .from("client_invitations")
      .delete()
      .eq("id", inv.id);
  }

  // --- system_role の更新 ---
  if (highestRole) {
    await admin
      .from("users")
      .update({ system_role: highestRole })
      .eq("id", user.id);
  }

  return NextResponse.json({ ok: true });
}

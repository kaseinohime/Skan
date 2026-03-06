import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";

/** 招待を受諾してorganization_membersに追加 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const invitationId = typeof body.invitation_id === "string" ? body.invitation_id : null;

  if (!invitationId) {
    return NextResponse.json({ error: "invitation_id が必要です" }, { status: 400 });
  }

  const admin = createAdminClient();

  // 招待レコードを取得（自分のメール宛のみ）
  const { data: inv } = await admin
    .from("organization_invitations")
    .select("*")
    .eq("id", invitationId)
    .eq("email", user.email)
    .maybeSingle();

  if (!inv) {
    return NextResponse.json({ error: "招待が見つかりません" }, { status: 404 });
  }

  // すでにメンバーなら何もしない
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

  // agency_admin として招待された場合、system_role を昇格させる（master は変更しない）
  if (inv.role === "agency_admin") {
    await admin
      .from("users")
      .update({ system_role: "agency_admin" })
      .eq("id", user.id)
      .neq("system_role", "master");
  }

  // 組織名を取得してログ記録
  const { data: orgRow } = await admin
    .from("organizations")
    .select("name")
    .eq("id", inv.organization_id)
    .single();

  await logAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: "招待を承諾",
    entityType: "org_member",
    entityId: user.id,
    entityLabel: user.email,
    organizationId: inv.organization_id,
    organizationName: orgRow?.name,
    metadata: { role: inv.role },
  });

  // 招待レコードを削除
  await admin.from("organization_invitations").delete().eq("id", invitationId);

  // 対応する通知を既読にする
  await admin
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("type", "invitation")
    .eq("reference_id", inv.organization_id);

  return NextResponse.json({ ok: true, organization_id: inv.organization_id });
}

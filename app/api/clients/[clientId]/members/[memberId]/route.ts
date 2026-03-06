import { createClient } from "@/lib/supabase/server";
import { requireRole, requireAuth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ clientId: string; memberId: string }> }
) {
  const user = await requireRole(["master", "agency_admin"]);
  if (!user) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "権限がありません。" } },
      { status: 403 }
    );
  }

  const { clientId, memberId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "JSON を解析できません。" } },
      { status: 400 }
    );
  }

  const role = typeof body === "object" && body !== null && "role" in body && ((body as { role: unknown }).role === "staff" || (body as { role: unknown }).role === "client")
    ? (body as { role: "staff" | "client" }).role
    : undefined;
  const isActive = typeof body === "object" && body !== null && "is_active" in body && typeof (body as { is_active: unknown }).is_active === "boolean"
    ? (body as { is_active: boolean }).is_active
    : undefined;

  const updates: Record<string, unknown> = {};
  if (role !== undefined) updates.role = role;
  if (isActive !== undefined) updates.is_active = isActive;
  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "更新する項目を指定してください。" } },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { data: member, error } = await supabase
    .from("client_members")
    .update(updates)
    .eq("id", memberId)
    .eq("client_id", clientId)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: error.message } },
      { status: 500 }
    );
  }
  if (!member) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "メンバーが見つかりません。" } },
      { status: 404 }
    );
  }

  // クライアント情報を取得してログ記録
  const { data: clientRow } = await supabase
    .from("clients")
    .select("name, organization_id, organizations(name)")
    .eq("id", clientId)
    .single();
  const orgs = clientRow?.organizations as unknown as { name: string } | { name: string }[] | null;
  const orgName = Array.isArray(orgs) ? orgs[0]?.name : orgs?.name;

  const action = role !== undefined ? "クライアントメンバーのロールを変更" : "クライアントメンバーを更新";
  await logAudit({
    actorId: user.id,
    actorEmail: user.email,
    action,
    entityType: "client_member",
    entityId: memberId,
    organizationId: clientRow?.organization_id,
    organizationName: orgName,
    clientId,
    clientName: clientRow?.name,
    metadata: updates,
  });

  return NextResponse.json({ member });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ clientId: string; memberId: string }> }
) {
  const user = await requireRole(["master", "agency_admin"]);
  if (!user) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "権限がありません。" } },
      { status: 403 }
    );
  }

  const { clientId, memberId } = await params;
  const supabase = await createClient();

  // 削除前に情報を取得（ログ用）
  const { data: clientRow } = await supabase
    .from("clients")
    .select("name, organization_id, organizations(name)")
    .eq("id", clientId)
    .single();
  const orgs = clientRow?.organizations as unknown as { name: string } | { name: string }[] | null;
  const orgName = Array.isArray(orgs) ? orgs[0]?.name : orgs?.name;

  const { error } = await supabase
    .from("client_members")
    .delete()
    .eq("id", memberId)
    .eq("client_id", clientId);

  if (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: error.message } },
      { status: 500 }
    );
  }

  await logAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: "クライアントメンバーを削除",
    entityType: "client_member",
    entityId: memberId,
    organizationId: clientRow?.organization_id,
    organizationName: orgName,
    clientId,
    clientName: clientRow?.name,
  });

  return NextResponse.json({ ok: true });
}

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole, requireAuth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "ログインしてください。" } },
      { status: 401 }
    );
  }

  const { clientId } = await params;
  const supabase = await createClient();
  const { data: members, error } = await supabase
    .from("client_members")
    .select(
      `
      id,
      client_id,
      user_id,
      role,
      is_active,
      invited_at,
      joined_at,
      users(id, email, full_name)
    `
    )
    .eq("client_id", clientId)
    .order("joined_at", { nullsFirst: true });

  if (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ members: members ?? [] });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const user = await requireRole(["master", "agency_admin"]);
  if (!user) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "権限がありません。" } },
      { status: 403 }
    );
  }

  const { clientId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "JSON を解析できません。" } },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const b = body as { user_id?: string; email?: string; role?: "staff" | "client" };
  const userId = typeof b?.user_id === "string" ? b.user_id : null;
  const role =
    b?.role === "staff" || b?.role === "client" ? b.role : "staff";

  if (userId) {
    const { data: member, error } = await supabase
      .from("client_members")
      .insert({
        client_id: clientId,
        user_id: userId,
        role,
        is_active: true,
        joined_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: { code: "CONFLICT", message: "このユーザーは既にメンバーです。" } },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: { code: "INTERNAL_ERROR", message: error.message } },
        { status: 500 }
      );
    }

    // クライアント情報を取得してログ記録
    const { data: clientRow } = await supabase
      .from("clients")
      .select("name, organization_id, organizations(name)")
      .eq("id", clientId)
      .single();
    const orgs1 = clientRow?.organizations as unknown as { name: string } | { name: string }[] | null;
    const orgName = Array.isArray(orgs1) ? orgs1[0]?.name : orgs1?.name;

    await logAudit({
      actorId: user.id,
      actorEmail: user.email,
      action: "クライアントメンバーを追加",
      entityType: "client_member",
      entityId: userId,
      entityLabel: userId,
      organizationId: clientRow?.organization_id,
      organizationName: orgName,
      clientId,
      clientName: clientRow?.name,
      metadata: { role },
    });

    return NextResponse.json({ member });
  }

  const email = typeof b?.email === "string" ? b.email.trim() : null;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "有効なメールアドレスを入力してください。" } },
      { status: 400 }
    );
  }

  const { error: invError } = await supabase.from("client_invitations").insert({
    client_id: clientId,
    email,
    role,
  });
  if (invError) {
    if (invError.code === "23505") {
      return NextResponse.json(
        { error: { code: "CONFLICT", message: "このメールアドレスは既に招待済みです。" } },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: invError.message } },
      { status: 500 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:50000";
  try {
    const admin = createAdminClient();
    await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${appUrl}/auth/confirm`,
      data: { invited_to_client: clientId },
    });
  } catch {
    // 既存ユーザーでも招待レコードは残す
  }

  // クライアント情報を取得してログ記録
  const { data: clientRow } = await supabase
    .from("clients")
    .select("name, organization_id, organizations(name)")
    .eq("id", clientId)
    .single();
  const orgs2 = clientRow?.organizations as unknown as { name: string } | { name: string }[] | null;
  const orgName = Array.isArray(orgs2) ? orgs2[0]?.name : orgs2?.name;

  await logAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: "クライアントメンバーを招待",
    entityType: "client_member",
    entityId: email,
    entityLabel: email,
    organizationId: clientRow?.organization_id,
    organizationName: orgName,
    clientId,
    clientName: clientRow?.name,
    metadata: { role },
  });

  return NextResponse.json({ ok: true, invited: email });
}

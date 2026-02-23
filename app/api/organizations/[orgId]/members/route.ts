import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { getCurrentUserAgencyOrganizationId } from "@/lib/organization";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

function canAccessOrg(userRole: string, userOrgId: string | null, orgId: string): boolean {
  if (userRole === "master") return true;
  return userOrgId === orgId;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const user = await requireRole(["master", "agency_admin"]);
  if (!user) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "権限がありません。" } },
      { status: 403 }
    );
  }

  const { orgId } = await params;
  const agencyOrgId = await getCurrentUserAgencyOrganizationId();
  if (!canAccessOrg(user.system_role, agencyOrgId, orgId)) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "この企業にアクセスできません。" } },
      { status: 403 }
    );
  }

  const supabase = await createClient();
  const { data: members, error } = await supabase
    .from("organization_members")
    .select(`
      id,
      organization_id,
      user_id,
      role,
      is_active,
      invited_at,
      joined_at,
      users(id, email, full_name)
    `)
    .eq("organization_id", orgId)
    .order("joined_at", { nullsFirst: false });

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
  { params }: { params: Promise<{ orgId: string }> }
) {
  const user = await requireRole(["master", "agency_admin"]);
  if (!user) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "権限がありません。" } },
      { status: 403 }
    );
  }

  const { orgId } = await params;
  const agencyOrgId = await getCurrentUserAgencyOrganizationId();
  if (!canAccessOrg(user.system_role, agencyOrgId, orgId)) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "この企業に招待できません。" } },
      { status: 403 }
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

  const email =
    typeof body === "object" && body !== null && "email" in body && typeof (body as { email: unknown }).email === "string"
      ? (body as { email: string }).email.trim()
      : null;
  const role =
    typeof body === "object" && body !== null && "role" in body && ((body as { role: unknown }).role === "staff" || (body as { role: unknown }).role === "agency_admin")
      ? (body as { role: "staff" | "agency_admin" }).role
      : "staff";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "有効なメールアドレスを入力してください。" } },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { error: insertError } = await supabase.from("organization_invitations").insert({
    organization_id: orgId,
    email,
    role,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json(
        { error: { code: "CONFLICT", message: "このメールアドレスは既に招待済みです。" } },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: insertError.message } },
      { status: 500 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:20000";
  try {
    const admin = createAdminClient();
    const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${appUrl}/register`,
      data: { invited_to_organization: orgId },
    });
    if (inviteError && inviteError.message !== "A user with this email address has already been registered") {
      return NextResponse.json(
        { error: { code: "INVITE_ERROR", message: inviteError.message } },
        { status: 400 }
      );
    }
  } catch (e) {
    return NextResponse.json(
      { error: { code: "INVITE_ERROR", message: "招待メールの送信に失敗しました。" } },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}

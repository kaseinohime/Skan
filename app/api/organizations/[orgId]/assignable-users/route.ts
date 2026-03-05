import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { getCurrentUserAgencyOrganizationId } from "@/lib/organization";
import { NextResponse } from "next/server";

function canAccessOrg(userRole: string, userOrgId: string | null, orgId: string): boolean {
  if (userRole === "master") return true;
  return userOrgId === orgId;
}

/**
 * 組織の承認ステップに設定できる担当者候補（組織メンバー + いずれかのクライアントのメンバー）を返す
 */
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

  const { data: orgMembers } = await supabase
    .from("organization_members")
    .select("user_id, users!inner(id, full_name, email)")
    .eq("organization_id", orgId)
    .eq("is_active", true);

  const { data: clients } = await supabase
    .from("clients")
    .select("id")
    .eq("organization_id", orgId);

  const clientIds = (clients ?? []).map((c) => c.id);
  let clientMemberUsers: { id: string; full_name: string; email: string }[] = [];

  if (clientIds.length > 0) {
    const { data: cm } = await supabase
      .from("client_members")
      .select("user_id, users!inner(id, full_name, email)")
      .in("client_id", clientIds)
      .eq("is_active", true);
    if (cm) {
      clientMemberUsers = cm
        .filter((r) => r.users && typeof r.users === "object")
        .map((r) => {
          const u = Array.isArray(r.users) ? r.users[0] : r.users;
          if (!u || typeof u !== "object" || !("id" in u)) return null;
          return {
            id: String((u as { id: string }).id),
            full_name: String((u as { full_name: string }).full_name ?? ""),
            email: String((u as { email: string }).email ?? ""),
          };
        })
        .filter((u): u is { id: string; full_name: string; email: string } => u !== null);
    }
  }

  const orgUserRows = orgMembers ?? [];
  const orgUsers = orgUserRows
    .filter((r) => r.users && typeof r.users === "object")
    .map((r) => {
      const u = Array.isArray(r.users) ? r.users[0] : r.users;
      if (!u || typeof u !== "object" || !("id" in u)) return null;
      return {
        id: String((u as { id: string }).id),
        full_name: String((u as { full_name: string }).full_name ?? ""),
        email: String((u as { email: string }).email ?? ""),
      };
    })
    .filter((u): u is { id: string; full_name: string; email: string } => u !== null);

  const byId = new Map<string | undefined, { id: string; full_name: string; email: string }>();
  for (const u of orgUsers) {
    if (u.id) byId.set(u.id, u);
  }
  for (const u of clientMemberUsers) {
    if (u.id) byId.set(u.id, u);
  }
  const users = Array.from(byId.values()).sort((a, b) => (a.full_name || "").localeCompare(b.full_name || ""));

  return NextResponse.json({ users });
}

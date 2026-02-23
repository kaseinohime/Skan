import { createClient } from "@/lib/supabase/server";

/**
 * 現在のユーザーが所属する企業IDの一覧を取得（organization_members の is_active）
 */
export async function getCurrentUserOrganizationIds(): Promise<string[]> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return [];

  const { data: rows } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", authUser.id)
    .eq("is_active", true);
  return (rows ?? []).map((r) => r.organization_id);
}

/**
 * 企業管理者として所属する企業IDを1件取得（agency_admin の先頭）
 * クライアント作成時など、単一組織が必要なときに使用
 */
export async function getCurrentUserAgencyOrganizationId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return null;

  const { data: row } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", authUser.id)
    .eq("role", "agency_admin")
    .eq("is_active", true)
    .limit(1)
    .single();
  return row?.organization_id ?? null;
}

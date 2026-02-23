import { createClient } from "@/lib/supabase/server";

/**
 * ログインユーザーのメールに紐づく招待を処理し、organization_members に追加する。
 * ダッシュボード等のレイアウトから呼ぶ。
 */
export async function processPendingInvitations(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser?.email) return;

  const { data: invitations } = await supabase
    .from("organization_invitations")
    .select("id, organization_id, role")
    .eq("email", authUser.email);

  if (!invitations?.length) return;

  for (const inv of invitations) {
    await supabase.from("organization_members").upsert(
      {
        organization_id: inv.organization_id,
        user_id: authUser.id,
        role: inv.role,
        is_active: true,
        joined_at: new Date().toISOString(),
      },
      { onConflict: "organization_id,user_id" }
    );
    await supabase.from("organization_invitations").delete().eq("id", inv.id);
  }
}

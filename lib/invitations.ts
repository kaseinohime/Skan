import { createClient } from "@/lib/supabase/server";

/**
 * ログインユーザーのメールに紐づく招待を処理する。
 * - organization_invitations → organization_members に追加
 * - client_invitations → client_members に追加
 * ダッシュボード等のレイアウトから呼ぶ。
 * セッションがない場合（招待リンク直後など）は何もしない（Auth session missing を防ぐ）
 */
export async function processPendingInvitations(): Promise<void> {
  try {
    const supabase = await createClient();
    // 招待直後は getUser() が "Auth session missing!" を返すことがあるため、getSession() を併用
    let authUser = (await supabase.auth.getUser()).data.user;
    if (!authUser) {
      authUser = (await supabase.auth.getSession()).data.session?.user ?? null;
    }
    if (!authUser?.email) return;

  const { data: orgInvitations } = await supabase
    .from("organization_invitations")
    .select("id, organization_id, role")
    .eq("email", authUser.email);

  if (orgInvitations?.length) {
    for (const inv of orgInvitations) {
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

  const { data: clientInvitations } = await supabase
    .from("client_invitations")
    .select("id, client_id, role")
    .eq("email", authUser.email);

  if (clientInvitations?.length) {
    for (const inv of clientInvitations) {
      await supabase.from("client_members").upsert(
        {
          client_id: inv.client_id,
          user_id: authUser.id,
          role: inv.role,
          is_active: true,
          joined_at: new Date().toISOString(),
        },
        { onConflict: "client_id,user_id" }
      );
      await supabase.from("client_invitations").delete().eq("id", inv.id);
    }
  }
  } catch {
    // セッション未確立（招待直後のリダイレクト等）では何もしない
  }
}

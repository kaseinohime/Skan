import { createClient } from "@/lib/supabase/server";
import type { User, SystemRole } from "@/types";

/**
 * 現在ログインしているユーザー（public.users）を取得
 * get_my_profile() RPC を使用（RLS 経由の SELECT で 500 が出る場合の回避）
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return null;

  const { data: rows, error } = await supabase.rpc("get_my_profile");
  if (error || !Array.isArray(rows) || rows.length === 0) return null;
  return rows[0] as User;
}

/**
 * 現在のユーザーの system_role を取得
 */
export async function getUserRole(): Promise<SystemRole | null> {
  const user = await getCurrentUser();
  return user?.system_role ?? null;
}

/**
 * 認証必須。未認証なら null を返す（redirect は呼び出し側で行う）
 */
export async function requireAuth(): Promise<User | null> {
  const user = await getCurrentUser();
  return user;
}

/**
 * 指定ロールのいずれかであることを要求。違う場合は null
 */
export async function requireRole(
  allowedRoles: SystemRole[]
): Promise<User | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  if (!allowedRoles.includes(user.system_role)) return null;
  return user;
}

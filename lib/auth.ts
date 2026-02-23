import { createClient } from "@/lib/supabase/server";
import type { User, SystemRole } from "@/types";

/**
 * 現在ログインしているユーザー（public.users）を取得
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", authUser.id)
    .single();

  if (!profile || !profile.is_active) return null;
  return profile as User;
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

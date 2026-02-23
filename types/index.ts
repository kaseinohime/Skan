/**
 * アプリ共通の型定義
 * Supabase 生成型は database.ts に配置（Step 2 以降で生成）
 */

export type SystemRole = "master" | "agency_admin" | "staff" | "client";

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  system_role: SystemRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

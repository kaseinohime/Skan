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

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type OrganizationMemberRole = "agency_admin" | "staff";

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrganizationMemberRole;
  is_active: boolean;
  invited_at: string;
  joined_at: string | null;
  created_at: string;
  updated_at: string;
}

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

export interface Client {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  sns_platforms: string[];
  instagram_username: string | null;
  tiktok_username: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type ClientMemberRole = "staff" | "client";

export interface ClientMember {
  id: string;
  client_id: string;
  user_id: string;
  role: ClientMemberRole;
  is_active: boolean;
  invited_at: string;
  joined_at: string | null;
  created_at: string;
  updated_at: string;
}

export type CampaignStatus = "active" | "completed" | "archived";

export interface Campaign {
  id: string;
  client_id: string;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  status: CampaignStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type PostType = "feed" | "reel" | "story" | "tiktok";
export type PostPlatform = "instagram" | "tiktok";
export type PostStatus =
  | "draft"
  | "in_progress"
  | "pending_review"
  | "revision"
  | "approved"
  | "scheduled"
  | "published";

export interface Post {
  id: string;
  client_id: string;
  campaign_id: string | null;
  title: string;
  caption: string | null;
  hashtags: string[];
  post_type: PostType;
  platform: PostPlatform;
  status: PostStatus;
  scheduled_at: string | null;
  published_at: string | null;
  media_urls: string[];
  media_type: "image" | "video" | "carousel" | null;
  assigned_to: string | null;
  current_approval_step: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

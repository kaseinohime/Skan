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
  assigned_to: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type NotificationType =
  | "approval_request"
  | "approval_result"
  | "comment"
  | "mention"
  | "invitation"
  | "system";

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  type: NotificationType;
  reference_type: string | null;
  reference_id: string | null;
  is_read: boolean;
  created_at: string;
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

export type ApprovalStepRole = "staff" | "agency_admin" | "client";

export interface ApprovalStep {
  id: string;
  template_id: string;
  step_order: number;
  name: string;
  required_role: ApprovalStepRole;
  assigned_to: string | null;
  created_at: string;
}

export interface ApprovalTemplate {
  id: string;
  organization_id: string;
  name: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  steps?: ApprovalStep[];
}

export interface PostInsights {
  id: string;
  post_id: string;
  client_id: string;
  followers_count: number | null;
  reach: number | null;
  saves: number | null;
  follower_reach: number | null;
  non_follower_reach: number | null;
  profile_visits: number | null;
  follows: number | null;
  web_taps: number | null;
  discovery: number | null;
  target_segment: string | null;
  genre: string | null;
  theme: string | null;
  memo: string | null;
  save_rate: number | null;
  home_rate: number | null;
  profile_visit_rate: number | null;
  follower_conversion_rate: number | null;
  web_tap_rate: number | null;
  recorded_by: string | null;
  recorded_at: string;
  created_at: string;
  updated_at: string;
}

export type BenchmarkAccount = { url: string; note: string };
export type HashtagSet = { label: string; tags: string[] };
export type ContentIdea = { genre: string; topic: string; answer: string; memo: string; image_url: string };

export interface ClientAccountSettings {
  id: string;
  client_id: string;
  profile_text: string | null;
  caption_template: string | null;
  hashtag_sets: HashtagSet[];
  persona: string | null;
  kpi_save_rate_target: number;
  kpi_home_rate_target: number;
  benchmark_accounts: BenchmarkAccount[];
  competitor_accounts: BenchmarkAccount[];
  content_ideas: ContentIdea[];
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export type ReviewCommentTargetType = "image" | "video" | "caption" | "general";
export type ReviewCommentStatus = "open" | "resolved";

export interface ReviewComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  target_type: ReviewCommentTargetType | null;
  target_index: number | null;
  target_timestamp_sec: number | null;
  comment_status: ReviewCommentStatus;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
}

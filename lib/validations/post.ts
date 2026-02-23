import { z } from "zod";

const postType = z.enum(["feed", "reel", "story", "tiktok"]);
const platform = z.enum(["instagram", "tiktok"]);
const postStatus = z.enum([
  "draft",
  "in_progress",
  "pending_review",
  "revision",
  "approved",
  "scheduled",
  "published",
]);
const mediaType = z.enum(["image", "video", "carousel"]);

export const createPostSchema = z.object({
  campaign_id: z.string().uuid().optional().nullable(),
  title: z.string().min(1, "タイトルを入力してください").max(200),
  caption: z.string().max(2200).optional(),
  hashtags: z.array(z.string().max(100)).optional().default([]),
  post_type: postType.optional().default("feed"),
  platform: platform.optional().default("instagram"),
  status: postStatus.optional().default("draft"),
  scheduled_at: z.string().datetime().optional().nullable().or(z.literal("")),
  media_urls: z.array(z.string().url().or(z.literal(""))).optional().default([]),
  media_type: mediaType.optional().nullable(),
  assigned_to: z.string().uuid().optional().nullable(),
});

export const updatePostSchema = z.object({
  campaign_id: z.string().uuid().optional().nullable(),
  title: z.string().min(1).max(200).optional(),
  caption: z.string().max(2200).optional().nullable(),
  hashtags: z.array(z.string().max(100)).optional(),
  post_type: postType.optional(),
  platform: platform.optional(),
  status: postStatus.optional(),
  scheduled_at: z.string().datetime().optional().nullable().or(z.literal("")),
  media_urls: z.array(z.string().url().or(z.literal(""))).optional(),
  media_type: mediaType.optional().nullable(),
  assigned_to: z.string().uuid().optional().nullable(),
});

export const patchPostStatusSchema = z.object({ status: postStatus });
export const patchPostScheduleSchema = z.object({
  scheduled_at: z.string().datetime().nullable(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type PatchPostStatusInput = z.infer<typeof patchPostStatusSchema>;
export type PatchPostScheduleInput = z.infer<typeof patchPostScheduleSchema>;

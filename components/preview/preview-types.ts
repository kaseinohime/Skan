import type { PostType, PostPlatform } from "@/types";

export type PreviewData = {
  username: string;
  caption: string;
  hashtags: string[];
  mediaUrls: string[];
  mediaType: "image" | "video" | "carousel" | null;
  postType: PostType;
  platform: PostPlatform;
};

export const DEFAULT_PREVIEW_USERNAME = "アカウント名";

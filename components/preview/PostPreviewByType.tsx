"use client";

import { InstagramFeedPreview } from "./InstagramFeedPreview";
import { InstagramReelPreview } from "./InstagramReelPreview";
import { InstagramStoryPreview } from "./InstagramStoryPreview";
import { TikTokPreview } from "./TikTokPreview";
import type { PreviewData } from "./preview-types";
import type { PostType, PostPlatform } from "@/types";

type Props = {
  data: PreviewData;
  platform: PostPlatform;
  postType: PostType;
  className?: string;
};

export function PostPreviewByType({ data, platform, postType, className = "" }: Props) {
  if (platform === "tiktok") {
    return <TikTokPreview data={data} className={className} />;
  }
  switch (postType) {
    case "feed":
      return <InstagramFeedPreview data={data} className={className} />;
    case "reel":
      return <InstagramReelPreview data={data} className={className} />;
    case "story":
      return <InstagramStoryPreview data={data} className={className} />;
    case "tiktok":
      return <TikTokPreview data={data} className={className} />;
    default:
      return <InstagramFeedPreview data={data} className={className} />;
  }
}

"use client";

import { Heart, MessageCircle, Bookmark, Share2, Music2 } from "lucide-react";
import { MediaPreview } from "./media-preview";
import type { PreviewData } from "./preview-types";

type Props = { data: PreviewData; className?: string };

export function TikTokPreview({ data, className = "" }: Props) {
  const firstUrl = data.mediaUrls[0]?.trim() || "";
  const displayCaption = data.caption?.trim() || "";
  const hashtagLine = Array.isArray(data.hashtags)
    ? data.hashtags.filter(Boolean).map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ")
    : "";

  return (
    <div
      className={`flex w-full max-w-[270px] overflow-hidden rounded-xl border border-border bg-black shadow-lg ${className}`}
    >
      <div className="relative flex-1">
        <MediaPreview
          url={firstUrl}
          type="video"
          aspectRatio="9:16"
        />
        <div className="absolute bottom-0 left-0 right-14 p-3 text-white">
          <p className="text-sm font-semibold">@{data.username || "account"}</p>
          <p className="line-clamp-2 text-xs opacity-90">
            {displayCaption || "キャプションを入力"}
          </p>
          {hashtagLine && (
            <p className="mt-1 text-xs text-blue-300">{hashtagLine}</p>
          )}
          <p className="mt-1 flex items-center gap-1 text-xs opacity-80">
            <Music2 className="h-3 w-3" />
            音楽名
          </p>
        </div>
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 flex-col items-center gap-5 text-white">
          <div className="flex flex-col items-center">
            <Heart className="h-9 w-9" />
            <span className="text-xs">123</span>
          </div>
          <div className="flex flex-col items-center">
            <MessageCircle className="h-9 w-9" />
            <span className="text-xs">12</span>
          </div>
          <div className="flex flex-col items-center">
            <Bookmark className="h-9 w-9" />
            <span className="text-xs">0</span>
          </div>
          <Share2 className="h-9 w-9" />
        </div>
      </div>
    </div>
  );
}

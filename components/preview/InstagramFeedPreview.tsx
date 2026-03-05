"use client";

import { Heart, MessageCircle, Send, Bookmark } from "lucide-react";
import { MediaPreview } from "./media-preview";
import type { PreviewData } from "./preview-types";

type Props = { data: PreviewData; className?: string };

export function InstagramFeedPreview({ data, className = "" }: Props) {
  const firstUrl = data.mediaUrls[0]?.trim() || "";
  const displayCaption = data.caption?.trim() || "";
  const hashtagLine = Array.isArray(data.hashtags)
    ? data.hashtags.filter(Boolean).join(" ")
    : "";

  return (
    <div
      className={`w-full max-w-[375px] overflow-hidden rounded-xl border border-border bg-background shadow-lg ${className}`}
    >
      <div className="flex items-center gap-3 border-b border-border px-3 py-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 via-pink-500 to-purple-600 text-white text-xs font-semibold">
          {data.username?.slice(0, 1) || "?"}
        </div>
        <span className="truncate text-sm font-semibold">{data.username || "アカウント名"}</span>
        <span className="ml-auto text-muted-foreground">⋯</span>
      </div>

      <div className="max-w-[375px]">
        <MediaPreview
          url={firstUrl}
          type={data.mediaType === "video" ? "video" : "image"}
          aspectRatio="1:1"
        />
      </div>

      <div className="space-y-2 px-3 py-2">
        <div className="flex items-center gap-4">
          <Heart className="h-6 w-6" />
          <MessageCircle className="h-6 w-6" />
          <Send className="h-6 w-6" />
          <Bookmark className="ml-auto h-6 w-6" />
        </div>
        <p className="text-sm">
          <span className="font-semibold">{data.username || "アカウント名"}</span>{" "}
          {displayCaption ? (
            <>
              {displayCaption.length > 80 ? `${displayCaption.slice(0, 80)}...` : displayCaption}
            </>
          ) : (
            <span className="text-muted-foreground">キャプションを入力</span>
          )}
        </p>
        {hashtagLine && (
          <p className="text-sm text-blue-600">{hashtagLine}</p>
        )}
        <p className="text-xs text-muted-foreground">2時間前</p>
      </div>
    </div>
  );
}

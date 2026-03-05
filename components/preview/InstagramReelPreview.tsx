"use client";

import { Heart, MessageCircle, Send, Bookmark, Music2 } from "lucide-react";
import { MediaPreview } from "./media-preview";
import type { PreviewData } from "./preview-types";

type Props = { data: PreviewData; className?: string };

export function InstagramReelPreview({ data, className = "" }: Props) {
  const firstUrl = data.mediaUrls[0]?.trim() || "";
  const displayCaption = data.caption?.trim() || "";

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
        <div className="absolute bottom-0 left-0 right-12 p-3 text-white">
          <p className="text-sm font-semibold">{data.username || "アカウント名"}</p>
          <p className="line-clamp-2 text-xs opacity-90">
            {displayCaption || "キャプションを入力"}
          </p>
          <p className="mt-1 flex items-center gap-1 text-xs opacity-80">
            <Music2 className="h-3 w-3" />
            音楽名
          </p>
        </div>
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 flex-col gap-4 text-white">
          <Heart className="h-8 w-8" />
          <MessageCircle className="h-8 w-8" />
          <Send className="h-8 w-8" />
          <Bookmark className="h-8 w-8" />
        </div>
      </div>
    </div>
  );
}

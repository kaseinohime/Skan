"use client";

import { MediaPreview } from "./media-preview";
import type { PreviewData } from "./preview-types";

type Props = { data: PreviewData; className?: string };

export function InstagramStoryPreview({ data, className = "" }: Props) {
  const firstUrl = data.mediaUrls[0]?.trim() || "";

  return (
    <div
      className={`flex w-full max-w-[270px] overflow-hidden rounded-xl border-2 border-border bg-black shadow-lg ${className}`}
    >
      <div className="relative w-full">
        <MediaPreview
          url={firstUrl}
          type={data.mediaType === "video" ? "video" : "image"}
          aspectRatio="9:16"
        />
        <div className="absolute left-0 right-0 top-0 flex items-center gap-2 p-3">
          <div className="h-8 w-1 rounded-full bg-white/80" />
          <div className="h-8 w-1 rounded-full bg-white/40" />
          <div className="h-8 w-1 rounded-full bg-white/40" />
        </div>
        <div className="absolute left-3 top-12 flex items-center gap-2">
          <div className="h-8 w-8 rounded-full border-2 border-white bg-gradient-to-br from-amber-400 to-pink-500" />
          <span className="text-sm font-semibold text-white drop-shadow-md">
            {data.username || "アカウント名"}
          </span>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Image as ImageIcon, Video, Link2 } from "lucide-react";
import { getGoogleDriveImageUrl, getGoogleDriveEmbedUrl, getGoogleDriveFileId } from "@/lib/drive-url";

type MediaPreviewProps = {
  url: string;
  type?: "image" | "video" | null;
  className?: string;
  aspectRatio?: "1:1" | "4:5" | "9:16";
};

export function MediaPreview({
  url,
  type,
  className = "",
  aspectRatio = "1:1",
}: MediaPreviewProps) {
  const [imgError, setImgError] = useState(false);
  const trimmed = url?.trim() ?? "";
  const driveId = trimmed ? getGoogleDriveFileId(trimmed) : null;
  const driveImageUrl = trimmed ? getGoogleDriveImageUrl(trimmed) : null;
  const driveEmbedUrl = trimmed ? getGoogleDriveEmbedUrl(trimmed) : null;

  const aspectClass =
    aspectRatio === "9:16"
      ? "aspect-[9/16]"
      : aspectRatio === "4:5"
        ? "aspect-[4/5]"
        : "aspect-square";

  if (!trimmed) {
    return (
      <div
        className={`flex ${aspectClass} w-full items-center justify-center rounded-lg bg-muted ${className}`}
      >
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          {type === "video" ? (
            <Video className="h-12 w-12" />
          ) : (
            <ImageIcon className="h-12 w-12" />
          )}
          <span className="text-xs">素材未設定</span>
        </div>
      </div>
    );
  }

  const isVideo = type === "video" || (driveEmbedUrl && !type);
  const tryImage = !isVideo && driveImageUrl && !imgError;

  if (tryImage) {
    return (
      <div className={`relative w-full overflow-hidden rounded-lg bg-muted ${aspectClass} ${className}`}>
        <img
          src={driveImageUrl}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
        {imgError && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <a
              href={trimmed}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <Link2 className="h-10 w-10" />
              <span className="text-xs">Google Drive で開く</span>
            </a>
          </div>
        )}
      </div>
    );
  }

  if (isVideo && driveEmbedUrl) {
    return (
      <div className={`relative w-full overflow-hidden rounded-lg bg-black ${aspectClass} ${className}`}>
        <iframe
          src={driveEmbedUrl}
          title="動画プレビュー"
          className="absolute inset-0 h-full w-full"
          allow="autoplay"
          allowFullScreen
        />
      </div>
    );
  }

  if (driveId) {
    return (
      <div
        className={`flex ${aspectClass} w-full items-center justify-center rounded-lg bg-muted ${className}`}
      >
        <a
          href={trimmed}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <Link2 className="h-10 w-10" />
          <span className="text-xs">Google Drive で開く</span>
        </a>
      </div>
    );
  }

  return (
    <div
      className={`flex ${aspectClass} w-full items-center justify-center rounded-lg bg-muted ${className}`}
    >
      <a
        href={trimmed}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground"
      >
        <Link2 className="h-10 w-10" />
        <span className="text-xs">リンクを開く</span>
      </a>
    </div>
  );
}

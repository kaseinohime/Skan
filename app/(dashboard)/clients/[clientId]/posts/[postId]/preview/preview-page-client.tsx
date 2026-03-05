"use client";

import { useState } from "react";
import { PostPreviewByType } from "@/components/preview/PostPreviewByType";
import type { PreviewData } from "@/components/preview/preview-types";
import type { PostType, PostPlatform } from "@/types";

type Props = { initialData: PreviewData };

export function PreviewPageClient({ initialData }: Props) {
  const [data] = useState<PreviewData>(initialData);
  const [platform, setPlatform] = useState<PostPlatform>(initialData.platform);
  const [postType, setPostType] = useState<PostType>(initialData.postType);

  const previewData: PreviewData = {
    ...data,
    platform,
    postType,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-border pb-4">
        <span className="mr-2 self-center text-sm font-medium text-muted-foreground">プラットフォーム:</span>
        <button
          type="button"
          onClick={() => setPlatform("instagram")}
          className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
            platform === "instagram"
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background hover:bg-muted"
          }`}
        >
          Instagram
        </button>
        <button
          type="button"
          onClick={() => setPlatform("tiktok")}
          className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
            platform === "tiktok"
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background hover:bg-muted"
          }`}
        >
          TikTok
        </button>
      </div>

      {platform === "instagram" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <span className="mr-2 self-center text-sm font-medium text-muted-foreground">投稿種別:</span>
            {(["feed", "reel", "story"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setPostType(type)}
                className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                  postType === type
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:bg-muted"
                }`}
              >
                {type === "feed" ? "フィード" : type === "reel" ? "リール" : "ストーリー"}
              </button>
            ))}
          </div>
          <PostPreviewByType
            data={previewData}
            platform="instagram"
            postType={postType}
          />
        </div>
      )}

      {platform === "tiktok" && (
        <PostPreviewByType
          data={{ ...previewData, platform: "tiktok", postType: "tiktok" }}
          platform="tiktok"
          postType="tiktok"
        />
      )}
    </div>
  );
}

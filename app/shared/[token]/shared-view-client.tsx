"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PostPreviewByType } from "@/components/preview/PostPreviewByType";
import type { SharedLinkPayload } from "@/lib/guest-link";
import type { PreviewData } from "@/components/preview/preview-types";
import type { PostPlatform, PostType } from "@/types";

const statusLabel: Record<string, string> = {
  draft: "下書き",
  in_progress: "作成中",
  pending_review: "承認待ち",
  revision: "差し戻し",
  approved: "承認済み",
  scheduled: "予約済み",
  published: "公開済み",
};

type Props = { data: SharedLinkPayload };

export function SharedViewClient({ data }: Props) {
  if (data.scope === "post" && data.post) {
    const post = data.post;
    const previewData: PreviewData = {
      username: "アカウント名",
      caption: post.caption ?? "",
      hashtags: Array.isArray(post.hashtags) ? post.hashtags : [],
      mediaUrls: Array.isArray(post.media_urls) ? post.media_urls.filter(Boolean) : [],
      mediaType: (post.media_type as PreviewData["mediaType"]) ?? null,
      postType: (post.post_type as PostType) ?? "feed",
      platform: (post.platform as PostPlatform) ?? "instagram",
    };
    return (
      <div className="mx-auto max-w-md space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{post.title ?? "投稿"}</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{statusLabel[post.status] ?? post.status}</Badge>
              {post.scheduled_at && (
                <span className="text-muted-foreground text-sm">
                  {new Date(post.scheduled_at).toLocaleString("ja")}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <PostPreviewByType
              data={previewData}
              platform={previewData.platform}
              postType={previewData.postType}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  const posts = data.posts ?? [];
  return (
    <div className="space-y-6">
      {data.scope === "campaign" && data.campaignName && (
        <h2 className="text-xl font-semibold">{data.campaignName}</h2>
      )}
      <p className="text-muted-foreground">
        {data.clientName}
        {data.scope === "campaign" ? ` — 企画「${data.campaignName}」の投稿一覧` : " の投稿一覧"}
      </p>
      {posts.length === 0 ? (
        <p className="text-muted-foreground">投稿はまだありません。</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <li key={post.id}>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{post.title ?? "無題"}</CardTitle>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{statusLabel[post.status] ?? post.status}</Badge>
                    <span className="text-muted-foreground text-xs">
                      {post.platform} / {post.post_type}
                    </span>
                  </div>
                  {post.scheduled_at && (
                    <p className="text-muted-foreground text-xs">
                      {new Date(post.scheduled_at).toLocaleString("ja")}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="line-clamp-2 text-sm">{post.caption || "—"}</p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

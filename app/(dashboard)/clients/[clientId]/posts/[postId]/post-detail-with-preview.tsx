"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PostForm } from "../post-form";
import { PostApprovalActions } from "@/components/approval/post-approval-actions";
import { PostPreviewByType } from "@/components/preview/PostPreviewByType";
import type { PreviewData } from "@/components/preview/preview-types";
import type { Post, PostStatus, PostType, PostPlatform } from "@/types";

const statusLabel: Record<PostStatus, string> = {
  draft: "下書き",
  in_progress: "作成中",
  pending_review: "承認待ち",
  revision: "差し戻し",
  approved: "承認済み",
  scheduled: "予約済み",
  published: "公開済み",
};

type CampaignOption = { id: string; name: string };
type ApprovalLog = {
  id: string;
  step_order: number;
  step_name: string;
  action: string;
  comment: string | null;
  acted_by: string;
  acted_at: string;
  acted_by_name: string | null;
};

function getPreviewUsername(
  instagramUsername: string | null,
  tiktokUsername: string | null,
  platform: PostPlatform
): string {
  if (platform === "instagram" && instagramUsername) {
    return instagramUsername.startsWith("@") ? instagramUsername.slice(1) : instagramUsername;
  }
  if (platform === "tiktok" && tiktokUsername) {
    return tiktokUsername.startsWith("@") ? tiktokUsername.slice(1) : tiktokUsername;
  }
  return "アカウント名";
}

type Props = {
  clientId: string;
  postId: string;
  post: Post;
  clientName: string;
  instagramUsername: string | null;
  tiktokUsername: string | null;
  campaigns: CampaignOption[];
  canApprove: boolean;
  approvalLogs: ApprovalLog[];
};

export function PostDetailWithPreview({
  clientId,
  postId,
  post,
  clientName,
  instagramUsername,
  tiktokUsername,
  campaigns,
  canApprove,
  approvalLogs,
}: Props) {
  const [previewData, setPreviewData] = useState<PreviewData>(() => ({
    username: getPreviewUsername(instagramUsername, tiktokUsername, post.platform),
    caption: post.caption ?? "",
    hashtags: Array.isArray(post.hashtags) ? post.hashtags : [],
    mediaUrls: Array.isArray(post.media_urls) ? post.media_urls.filter(Boolean) : [],
    mediaType: post.media_type,
    postType: post.post_type,
    platform: post.platform,
  }));

  const handleValuesChange = useCallback(
    (values: {
      caption: string;
      hashtags: string[];
      post_type: PostType;
      platform: PostPlatform;
      media_urls: string[];
    }) => {
      setPreviewData((prev) => ({
        ...prev,
        caption: values.caption,
        hashtags: values.hashtags,
        postType: values.post_type,
        platform: values.platform,
        mediaUrls: values.media_urls,
      }));
    },
    []
  );

  const scheduledAt = post.scheduled_at
    ? new Date(post.scheduled_at).toISOString().slice(0, 16)
    : "";

  return (
    <div className="container mx-auto max-w-5xl space-y-8 p-8">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/clients/${clientId}/posts`}>← 投稿一覧</Link>
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/clients/${clientId}/posts/${postId}/preview`}>
              プレビューを開く
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/clients/${clientId}/posts/${postId}/review`}>
              修正指示・コメント
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/clients/${clientId}/calendar`}>カレンダー</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr,340px]">
        <div className="min-w-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {post.title}
                <Badge variant="outline">{statusLabel[post.status]}</Badge>
              </CardTitle>
              <CardDescription>
                {post.platform} / {post.post_type}
                {post.scheduled_at &&
                  ` • ${new Date(post.scheduled_at).toLocaleString("ja")}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <PostApprovalActions
                clientId={clientId}
                postId={postId}
                postStatus={post.status}
                canApprove={canApprove}
                approvalLogs={approvalLogs}
              />
              <PostForm
                clientId={clientId}
                postId={postId}
                campaigns={campaigns}
                defaultValues={{
                  title: post.title,
                  caption: post.caption ?? "",
                  hashtags: post.hashtags ?? [],
                  post_type: post.post_type,
                  platform: post.platform,
                  status: post.status,
                  scheduled_at: scheduledAt,
                  media_urls: post.media_urls?.length ? post.media_urls : [""],
                  campaign_id: post.campaign_id,
                }}
                onValuesChange={handleValuesChange}
              />
            </CardContent>
          </Card>
        </div>

        <div className="lg:sticky lg:top-8 lg:self-start">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">プレビュー</CardTitle>
              <CardDescription>
                編集内容がリアルタイムで反映されます
              </CardDescription>
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
      </div>
    </div>
  );
}

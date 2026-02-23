import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PostForm } from "../post-form";
import type { Post, PostStatus } from "@/types";

export const dynamic = "force-dynamic";

const statusLabel: Record<PostStatus, string> = {
  draft: "下書き",
  in_progress: "作成中",
  pending_review: "承認待ち",
  revision: "差し戻し",
  approved: "承認済み",
  scheduled: "予約済み",
  published: "公開済み",
};

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ clientId: string; postId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;

  const { clientId, postId } = await params;
  const supabase = await createClient();

  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("*")
    .eq("id", postId)
    .eq("client_id", clientId)
    .single();

  if (postError || !post) notFound();

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, name")
    .eq("client_id", clientId)
    .order("name");

  const p = post as Post;
  const scheduledAt = p.scheduled_at
    ? new Date(p.scheduled_at).toISOString().slice(0, 16)
    : "";

  return (
    <div className="container mx-auto max-w-2xl space-y-8 p-8">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/clients/${clientId}/posts`}>← 投稿一覧</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/clients/${clientId}/calendar`}>カレンダー</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {p.title}
            <Badge variant="outline">{statusLabel[p.status]}</Badge>
          </CardTitle>
          <CardDescription>
            {p.platform} / {p.post_type}
            {p.scheduled_at && ` • ${new Date(p.scheduled_at).toLocaleString("ja")}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <PostForm
            clientId={clientId}
            postId={postId}
            campaigns={campaigns ?? []}
            defaultValues={{
              title: p.title,
              caption: p.caption ?? "",
              hashtags: p.hashtags ?? [],
              post_type: p.post_type,
              platform: p.platform,
              status: p.status,
              scheduled_at: scheduledAt,
              media_urls: p.media_urls?.length ? p.media_urls : [""],
              campaign_id: p.campaign_id,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

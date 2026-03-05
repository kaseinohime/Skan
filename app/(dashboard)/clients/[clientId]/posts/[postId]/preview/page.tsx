import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PreviewPageClient } from "./preview-page-client";
import type { Post, PostType, PostPlatform } from "@/types";

export const dynamic = "force-dynamic";

function getPreviewUsername(
  client: { instagram_username?: string | null; tiktok_username?: string | null },
  platform: PostPlatform
): string {
  if (platform === "instagram" && client.instagram_username) {
    return client.instagram_username.startsWith("@")
      ? client.instagram_username.slice(1)
      : client.instagram_username;
  }
  if (platform === "tiktok" && client.tiktok_username) {
    return client.tiktok_username.startsWith("@")
      ? client.tiktok_username.slice(1)
      : client.tiktok_username;
  }
  return "アカウント名";
}

export default async function PostPreviewPage({
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

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id, name, instagram_username, tiktok_username")
    .eq("id", clientId)
    .single();

  if (clientError || !client) notFound();

  const p = post as Post;
  const previewData = {
    username: getPreviewUsername(client, p.platform),
    caption: p.caption ?? "",
    hashtags: Array.isArray(p.hashtags) ? p.hashtags : [],
    mediaUrls: Array.isArray(p.media_urls) ? p.media_urls.filter(Boolean) : [],
    mediaType: p.media_type,
    postType: p.post_type as PostType,
    platform: p.platform as PostPlatform,
  };

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">投稿プレビュー</h1>
          <p className="text-muted-foreground">{p.title} — SNS風表示</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/clients/${clientId}/posts/${postId}`}>編集に戻る</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/clients/${clientId}/posts/${postId}/review`}>
              修正指示・コメント
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/clients/${clientId}/posts`}>投稿一覧</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>プレビュー</CardTitle>
          <CardDescription>
            プラットフォーム・投稿種別を切り替えて表示を確認できます。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PreviewPageClient initialData={previewData} />
        </CardContent>
      </Card>
    </div>
  );
}

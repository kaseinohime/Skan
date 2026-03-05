import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InsightsForm } from "@/components/insights/insights-form";
import { AiSuggestionsPanel } from "@/components/insights/ai-suggestions";
import type { PostInsights, PostStatus } from "@/types";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";

const statusLabel: Record<PostStatus, string> = {
  draft:          "下書き",
  in_progress:    "作成中",
  pending_review: "承認待ち",
  revision:       "差し戻し",
  approved:       "承認済み",
  scheduled:      "予約済み",
  published:      "公開済み",
};

export const dynamic = "force-dynamic";

export default async function PostInsightsPage({
  params,
}: {
  params: Promise<{ clientId: string; postId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;

  const { clientId, postId } = await params;
  const supabase = await createClient();

  const [
    { data: post, error: postError },
    { data: insightsData },
    { data: accountSettings },
    { data: clientData },
  ] = await Promise.all([
    supabase
      .from("posts")
      .select("id, title, status, platform, post_type, scheduled_at")
      .eq("id", postId)
      .eq("client_id", clientId)
      .single(),
    supabase
      .from("post_insights")
      .select("*")
      .eq("post_id", postId)
      .maybeSingle(),
    supabase
      .from("client_account_settings")
      .select("kpi_save_rate_target, kpi_home_rate_target")
      .eq("client_id", clientId)
      .maybeSingle(),
    supabase
      .from("clients")
      .select("name")
      .eq("id", clientId)
      .single(),
  ]);

  if (postError || !post) notFound();

  const isReadonly = user.system_role === "client";

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-8">
      <BreadcrumbNav items={[
        { label: "クライアント一覧", href: "/clients" },
        { label: clientData?.name ?? "", href: `/clients/${clientId}` },
        { label: "投稿一覧", href: `/clients/${clientId}/posts` },
        { label: post.title, href: `/clients/${clientId}/posts/${postId}` },
        { label: "インサイス" },
      ]} />
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/clients/${clientId}/posts/${postId}`}>← 投稿詳細</Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold">{post.title}</h1>
            <p className="text-sm text-muted-foreground">
              {post.platform} / {post.post_type}
              {post.scheduled_at &&
                ` • ${new Date(post.scheduled_at).toLocaleDateString("ja")}`}
            </p>
          </div>
          <Badge variant="outline">{statusLabel[post.status as PostStatus] ?? post.status}</Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/clients/${clientId}/posts/${postId}/preview`}>
              プレビュー
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/clients/${clientId}/insights`}>
              ダッシュボード
            </Link>
          </Button>
        </div>
      </div>

      {/* インサイスフォーム */}
      <Card>
        <CardHeader>
          <CardTitle>インサイス入力</CardTitle>
          <CardDescription>
            SNSのインサイス画面を見ながら数値を入力してください。保存率・ホーム率等は自動計算されます。
            {insightsData && (
              <span className="ml-2 text-xs text-muted-foreground">
                最終更新: {new Date(insightsData.updated_at).toLocaleString("ja")}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InsightsForm
            clientId={clientId}
            postId={postId}
            initialInsights={insightsData as PostInsights | null}
            kpiSaveRateTarget={accountSettings?.kpi_save_rate_target ?? 0.02}
            kpiHomeRateTarget={accountSettings?.kpi_home_rate_target ?? 0.40}
            readonly={isReadonly}
          />
        </CardContent>
      </Card>

      {/* AI改善提案（clientロール以外に表示） */}
      {!isReadonly && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI改善提案</CardTitle>
            <CardDescription>
              入力したインサイス数値をもとに、次回投稿への改善ポイントをAIが提案します。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AiSuggestionsPanel
              clientId={clientId}
              postId={postId}
              hasInsights={!!insightsData}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

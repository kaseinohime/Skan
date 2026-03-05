import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, FileCheck, FileText, Calendar, Users, ArrowRight, FolderKanban, BarChart2, FileDown, AlertCircle } from "lucide-react";
import { GuestLinksSection } from "@/components/guest-links/guest-links-section";
import type { PostStatus } from "@/types";

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

const statusVariant: Record<PostStatus, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "outline",
  in_progress: "secondary",
  pending_review: "default",
  revision: "destructive",
  approved: "default",
  scheduled: "secondary",
  published: "outline",
};

export default async function ClientWorkspacePage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  const { clientId } = await params;
  const supabase = await createClient();
  const { data: client, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .single();

  if (error || !client) {
    notFound();
  }

  const [
    { data: campaigns },
    { data: allPosts },
    { data: recentPosts },
    { count: pendingCount },
    { count: memberCount },
    { data: publishedWithoutInsights },
  ] = await Promise.all([
    supabase.from("campaigns").select("id, name").eq("client_id", clientId).order("name"),
    supabase.from("posts").select("id, title").eq("client_id", clientId).order("scheduled_at", { ascending: true }),
    supabase
      .from("posts")
      .select("id, title, status, scheduled_at, post_type, platform")
      .eq("client_id", clientId)
      .order("updated_at", { ascending: false })
      .limit(5),
    supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("client_id", clientId)
      .eq("status", "pending_review"),
    supabase
      .from("client_members")
      .select("id", { count: "exact", head: true })
      .eq("client_id", clientId)
      .eq("is_active", true),
    // 公開済み投稿（インサイス未入力チェック用）
    supabase
      .from("posts")
      .select("id, title")
      .eq("client_id", clientId)
      .eq("status", "published")
      .order("scheduled_at", { ascending: false })
      .limit(20),
  ]);

  const totalPosts = allPosts?.length ?? 0;

  // 公開済み投稿のうちインサイス未入力のものを検索
  let noInsightsPosts: { id: string; title: string }[] = [];
  if (publishedWithoutInsights && publishedWithoutInsights.length > 0) {
    const pubIds = publishedWithoutInsights.map((p) => p.id);
    const { data: existingInsights } = await supabase
      .from("post_insights")
      .select("post_id")
      .in("post_id", pubIds);
    const insightedIds = new Set((existingInsights ?? []).map((i) => i.post_id));
    noInsightsPosts = publishedWithoutInsights
      .filter((p) => !insightedIds.has(p.id))
      .slice(0, 5);
  }

  return (
    <div className="container mx-auto max-w-5xl space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{client.name}</h1>
          <p className="text-muted-foreground mt-1">
            {client.slug}
            {client.instagram_username && (
              <>
                {" • "}
                <a
                  href={`https://www.instagram.com/${client.instagram_username.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline text-primary"
                >
                  @{client.instagram_username.replace(/^@/, "")}
                </a>
              </>
            )}
            {client.tiktok_username && (
              <>
                {" • "}
                <a
                  href={`https://www.tiktok.com/@${client.tiktok_username.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline text-primary"
                >
                  @{client.tiktok_username.replace(/^@/, "")}
                </a>
              </>
            )}
          </p>
        </div>
        {(user.system_role === "agency_admin" || user.system_role === "master") && (
          <Button variant="outline" className="rounded-lg" asChild>
            <Link href={`/clients/${clientId}/edit`}>編集</Link>
          </Button>
        )}
      </div>

      {/* サマリーカード */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              投稿数
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-2xl font-bold">{totalPosts}</p>
          </CardContent>
        </Card>
        <Card className={pendingCount ? "border-amber-400" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileCheck className="h-4 w-4" />
              承認待ち
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className={`text-2xl font-bold ${pendingCount ? "text-amber-600" : ""}`}>
              {pendingCount ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              チームメンバー
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-2xl font-bold">{memberCount ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* ナビゲーション */}
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader>
          <div className="flex items-center gap-2 text-primary">
            <Building2 className="h-5 w-5" />
          </div>
          <CardTitle>ワークスペース</CardTitle>
          <CardDescription>
            このクライアントの投稿・企画・チームを管理します
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {client.description && (
            <p className="text-muted-foreground">{client.description}</p>
          )}
          <div className="flex flex-wrap gap-3 pt-2">
            <Button asChild size="sm" className="rounded-lg gap-1">
              <Link href={`/clients/${clientId}/posts/new`}>
                <span>+ 新規投稿</span>
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="rounded-lg">
              <Link href={`/clients/${clientId}/campaigns`}>
                <FolderKanban className="mr-1 h-3.5 w-3.5" />企画
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="rounded-lg">
              <Link href={`/clients/${clientId}/posts`}>
                <FileText className="mr-1 h-3.5 w-3.5" />投稿一覧
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="rounded-lg">
              <Link href={`/clients/${clientId}/calendar`}>
                <Calendar className="mr-1 h-3.5 w-3.5" />カレンダー
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="rounded-lg">
              <Link href={`/clients/${clientId}/insights`}>
                <BarChart2 className="mr-1 h-3.5 w-3.5" />インサイス
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="rounded-lg">
              <Link href={`/clients/${clientId}/team`}>
                <Users className="mr-1 h-3.5 w-3.5" />チーム
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="rounded-lg">
              <Link href={`/clients/${clientId}/report`}>
                <FileDown className="mr-1 h-3.5 w-3.5" />月次レポート
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* インサイス未入力警告 */}
      {noInsightsPosts.length > 0 && (
        <Card className="border-amber-300 bg-amber-50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-amber-800">
              <AlertCircle className="h-4 w-4" />
              インサイス未入力の公開済み投稿（{noInsightsPosts.length}件）
            </CardTitle>
            <CardDescription className="text-amber-700">
              公開済みなのにインサイス数値が入力されていない投稿があります。
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="space-y-1">
              {noInsightsPosts.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/clients/${clientId}/posts/${p.id}/insights`}
                    className="text-sm text-amber-800 hover:underline"
                  >
                    → {p.title}
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* 直近の投稿 */}
      {(recentPosts?.length ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">直近の投稿</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/clients/${clientId}/posts`}>
                  すべて見る <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="divide-y">
            {recentPosts!.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/clients/${clientId}/posts/${p.id}`}
                    className="block truncate font-medium hover:underline"
                  >
                    {p.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {p.platform} / {p.post_type}
                    {p.scheduled_at && ` • ${new Date(p.scheduled_at).toLocaleDateString("ja")}`}
                  </p>
                </div>
                <Badge variant={statusVariant[p.status as PostStatus]} className="ml-3 shrink-0">
                  {statusLabel[p.status as PostStatus] ?? p.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <GuestLinksSection
        clientId={clientId}
        campaigns={campaigns ?? []}
        posts={allPosts ?? []}
      />
    </div>
  );
}

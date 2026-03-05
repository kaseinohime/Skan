import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, Plus, Calendar } from "lucide-react";
import type { PostStatus } from "@/types";

export const dynamic = "force-dynamic";

const STATUS_OPTIONS: { value: PostStatus | "all" | "active"; label: string }[] = [
  { value: "all",            label: "すべて" },
  { value: "active",         label: "未公開のみ" },
  { value: "draft",          label: "下書き" },
  { value: "in_progress",    label: "作成中" },
  { value: "pending_review", label: "承認待ち" },
  { value: "revision",       label: "差し戻し" },
  { value: "approved",       label: "承認済み" },
  { value: "scheduled",      label: "予約済み" },
  { value: "published",      label: "公開済み" },
];

const ACTIVE_STATUSES: PostStatus[] = ["draft", "in_progress", "pending_review", "revision", "approved", "scheduled"];

const statusLabel: Record<PostStatus, string> = {
  draft:          "下書き",
  in_progress:    "作成中",
  pending_review: "承認待ち",
  revision:       "差し戻し",
  approved:       "承認済み",
  scheduled:      "予約済み",
  published:      "公開済み",
};

// ステータスごとの色クラス
const statusClass: Record<PostStatus, string> = {
  draft:          "border-gray-300 text-gray-500",
  in_progress:    "border-blue-400 text-blue-600 bg-blue-50",
  pending_review: "border-amber-400 text-amber-600 bg-amber-50",
  revision:       "border-red-400 text-red-600 bg-red-50",
  approved:       "border-green-400 text-green-600 bg-green-50",
  scheduled:      "border-purple-400 text-purple-600 bg-purple-50",
  published:      "border-emerald-400 text-emerald-600 bg-emerald-50",
};

const PAGE_SIZE = 20;

export default async function ClientPostsPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;

  const { clientId } = await params;
  const { status: statusFilter, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam ?? 1));
  const offset = (page - 1) * PAGE_SIZE;
  const supabase = await createClient();

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id, name")
    .eq("id", clientId)
    .single();

  if (clientError || !client) notFound();

  let query = supabase
    .from("posts")
    .select("id, title, status, post_type, platform, scheduled_at, campaign_id", { count: "exact" })
    .eq("client_id", clientId);

  const validStatus = STATUS_OPTIONS.map((o) => o.value).filter((v) => v !== "all" && v !== "active");
  if (statusFilter === "active") {
    query = query.in("status", ACTIVE_STATUSES);
  } else if (statusFilter && validStatus.includes(statusFilter as PostStatus)) {
    query = query.eq("status", statusFilter);
  }

  query = query
    .order("updated_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  const { data: posts, count: totalCount } = await query;
  const totalPages = Math.ceil((totalCount ?? 0) / PAGE_SIZE);

  // インサイス入力済みの投稿IDを取得
  const postIds = (posts ?? []).map((p) => p.id);
  let insightedIds = new Set<string>();
  if (postIds.length > 0) {
    const { data: ins } = await supabase
      .from("post_insights")
      .select("post_id")
      .in("post_id", postIds);
    insightedIds = new Set((ins ?? []).map((i) => i.post_id));
  }

  const activeFilter: string =
    statusFilter === "active"
      ? "active"
      : statusFilter && validStatus.includes(statusFilter as PostStatus)
      ? statusFilter
      : "all";

  return (
    <div className="container mx-auto max-w-5xl space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">投稿一覧</h1>
          <p className="text-muted-foreground">{client.name} の投稿</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/clients/${clientId}/calendar`}>
              <Calendar className="mr-1 h-3.5 w-3.5" />
              カレンダーで見る
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/clients/${clientId}`}>ワークスペースに戻る</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href={`/clients/${clientId}/posts/new`}>
              <Plus className="mr-2 h-4 w-4" />
              新規投稿
            </Link>
          </Button>
        </div>
      </div>

      {/* ステータスフィルター */}
      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((opt) => (
          <Link
            key={opt.value}
            href={opt.value === "all"
              ? `/clients/${clientId}/posts`
              : `/clients/${clientId}/posts?status=${opt.value}`}
            className={`rounded-full border px-3 py-1 text-sm transition-colors ${
              activeFilter === opt.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
            }`}
          >
            {opt.label}
          </Link>
        ))}
      </div>
      <p className="text-xs text-muted-foreground -mt-2">
        デフォルト表示：最近更新したものが上。「未公開のみ」で作業中の投稿に絞れます。
      </p>

      {!posts?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">
              {activeFilter === "all" ? "投稿がまだありません" : "該当する投稿がありません"}
            </p>
            {activeFilter === "all" && (
              <Button asChild className="mt-4">
                <Link href={`/clients/${clientId}/posts/new`}>最初の投稿を作成</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              投稿
              {activeFilter === "active" && "（未公開のみ）"}
              {activeFilter !== "all" && activeFilter !== "active" && `（${statusLabel[activeFilter as PostStatus]}）`}
              <span className="ml-2 text-base font-normal text-muted-foreground">
                {posts.length}件
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>タイトル</TableHead>
                  <TableHead>種別</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead>インサイス</TableHead>
                  <TableHead>予定日時</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/clients/${clientId}/posts/${p.id}`}
                        className="hover:underline"
                      >
                        {p.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {p.platform} / {p.post_type}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusClass[p.status as PostStatus]}
                      >
                        {statusLabel[p.status as PostStatus]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {insightedIds.has(p.id) ? (
                        <span className="text-xs text-emerald-600 font-medium">✓ 入力済</span>
                      ) : p.status === "published" ? (
                        <Link
                          href={`/clients/${clientId}/posts/${p.id}/insights`}
                          className="text-xs text-amber-600 hover:underline"
                        >
                          未入力
                        </Link>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {p.scheduled_at
                        ? new Date(p.scheduled_at).toLocaleString("ja")
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ページネーション */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/clients/${clientId}/posts?${new URLSearchParams({
                ...(activeFilter !== "all" ? { status: activeFilter } : {}),
                page: String(page - 1),
              })}`}>
                ← 前へ
              </Link>
            </Button>
          )}
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages} ページ
          </span>
          {page < totalPages && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/clients/${clientId}/posts?${new URLSearchParams({
                ...(activeFilter !== "all" ? { status: activeFilter } : {}),
                page: String(page + 1),
              })}`}>
                次へ →
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

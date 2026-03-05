import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, FileText } from "lucide-react";
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

const statusClass: Record<PostStatus, string> = {
  draft: "border-gray-300 text-gray-500",
  in_progress: "border-blue-400 text-blue-600 bg-blue-50",
  pending_review: "border-amber-400 text-amber-600 bg-amber-50",
  revision: "border-red-400 text-red-600 bg-red-50",
  approved: "border-green-400 text-green-600 bg-green-50",
  scheduled: "border-purple-400 text-purple-600 bg-purple-50",
  published: "border-emerald-400 text-emerald-600 bg-emerald-50",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;

  const { q } = await searchParams;
  const supabase = await createClient();

  let results: {
    id: string;
    title: string;
    status: string;
    platform: string;
    post_type: string;
    scheduled_at: string | null;
    client_id: string;
    client_name: string;
  }[] = [];

  if (q?.trim()) {
    const { data: posts } = await supabase
      .from("posts")
      .select("id, title, status, platform, post_type, scheduled_at, client_id")
      .ilike("title", `%${q.trim()}%`)
      .order("updated_at", { ascending: false })
      .limit(50);

    if (posts?.length) {
      const clientIds = [...new Set(posts.map((p) => p.client_id))];
      const { data: clients } = await supabase
        .from("clients")
        .select("id, name")
        .in("id", clientIds);
      const clientMap = new Map((clients ?? []).map((c) => [c.id, c.name]));
      results = posts.map((p) => ({
        ...p,
        client_name: clientMap.get(p.client_id) ?? "—",
      }));
    }
  }

  return (
    <div className="container mx-auto max-w-3xl space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Search className="h-6 w-6" />
          投稿を検索
        </h1>
        <p className="text-muted-foreground mt-1">全クライアントの投稿タイトルを横断検索します</p>
      </div>

      <form method="GET" className="flex gap-2">
        <Input
          name="q"
          defaultValue={q ?? ""}
          placeholder="投稿タイトルを入力..."
          className="flex-1"
          autoFocus
        />
        <Button type="submit">検索</Button>
      </form>

      {q?.trim() && (
        <p className="text-sm text-muted-foreground">
          「{q}」の検索結果：{results.length}件
        </p>
      )}

      {results.length > 0 ? (
        <div className="space-y-2">
          {results.map((p) => (
            <Card key={p.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="flex items-center justify-between py-3 px-4">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/clients/${p.client_id}/posts/${p.id}`}
                    className="font-medium hover:underline block truncate"
                  >
                    {p.title}
                  </Link>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {p.client_name} • {p.platform} / {p.post_type}
                    {p.scheduled_at && ` • ${new Date(p.scheduled_at).toLocaleDateString("ja")}`}
                  </p>
                </div>
                <Badge variant="outline" className={`ml-3 shrink-0 ${statusClass[p.status as PostStatus] ?? ""}`}>
                  {statusLabel[p.status as PostStatus] ?? p.status}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : q?.trim() ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">該当する投稿が見つかりません</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

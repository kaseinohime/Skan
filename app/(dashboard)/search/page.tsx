import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";
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

const statusBadgeColor: Record<PostStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  in_progress: "bg-blue-100 text-blue-700",
  pending_review: "bg-amber-100 text-amber-700",
  revision: "bg-red-100 text-red-700",
  approved: "bg-green-100 text-green-700",
  scheduled: "bg-indigo-100 text-indigo-700",
  published: "bg-emerald-100 text-emerald-700",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;

  const { q } = await searchParams;
  const keyword = q?.trim() ?? "";
  const supabase = await createClient();

  let results: {
    id: string;
    title: string;
    caption: string | null;
    status: string;
    platform: string;
    post_type: string;
    scheduled_at: string | null;
    client_id: string;
    client_name: string;
  }[] = [];

  let searchError = false;

  if (keyword) {
    // タイトル・キャプション・ハッシュタグを横断検索
    const escaped = keyword.replace(/%/g, "\\%").replace(/_/g, "\\_");
    const { data: posts, error } = await supabase
      .from("posts")
      .select("id, title, caption, status, platform, post_type, scheduled_at, client_id")
      .or(`title.ilike.%${escaped}%,caption.ilike.%${escaped}%`)
      .order("updated_at", { ascending: false })
      .limit(50);

    if (error) {
      searchError = true;
    } else if (posts?.length) {
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
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-black text-foreground">
          <Search className="h-6 w-6" />
          投稿を検索
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          全クライアントの投稿タイトル・本文を横断検索します
        </p>
      </div>

      <form action="/search" method="GET" className="flex gap-2">
        <Input
          name="q"
          defaultValue={keyword}
          placeholder="タイトルや本文のキーワードを入力..."
          className="flex-1 rounded-xl"
          autoFocus
        />
        <Button type="submit" className="rounded-xl">検索</Button>
      </form>

      {keyword && (
        <p className="text-sm text-muted-foreground">
          「{keyword}」の検索結果：{searchError ? "エラーが発生しました" : `${results.length}件`}
        </p>
      )}

      {results.length > 0 ? (
        <div className="divide-y divide-border/40 overflow-hidden rounded-2xl border border-border/60 bg-white/60 shadow-sm backdrop-blur-md">
          {results.map((p) => (
            <div key={p.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <Link
                  href={`/clients/${p.client_id}/posts/${p.id}`}
                  className="block truncate text-sm font-medium text-foreground hover:underline"
                >
                  {p.title}
                </Link>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {p.client_name} • {p.platform} / {p.post_type}
                  {p.scheduled_at &&
                    ` • ${new Date(p.scheduled_at).toLocaleDateString("ja")}`}
                </p>
                {p.caption && (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground/70">
                    {p.caption}
                  </p>
                )}
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                  statusBadgeColor[p.status as PostStatus] ?? "bg-gray-100 text-gray-700"
                }`}
              >
                {statusLabel[p.status as PostStatus] ?? p.status}
              </span>
            </div>
          ))}
        </div>
      ) : keyword ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border/60 bg-white/60 py-16 backdrop-blur-md">
          <FileText className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">該当する投稿が見つかりません</p>
        </div>
      ) : null}
    </div>
  );
}

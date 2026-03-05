"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, XCircle, ExternalLink, Loader2 } from "lucide-react";

type Post = {
  id: string;
  title: string;
  client_id: string;
  client_name: string;
  scheduled_at: string | null;
};

export function ApprovalActions({ posts: initialPosts }: { posts: Post[] }) {
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts);
  const [actingId, setActingId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectComment, setRejectComment] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const approve = async (post: Post) => {
    setActingId(post.id);
    setErrors({});
    const res = await fetch(
      `/api/clients/${post.client_id}/posts/${post.id}/approve`,
      { method: "POST" }
    );
    setActingId(null);
    if (res.ok) {
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({})) as { error?: { message: string } };
      setErrors({ [post.id]: data?.error?.message ?? "承認に失敗しました" });
    }
  };

  const reject = async (post: Post) => {
    setActingId(post.id);
    setErrors({});
    const res = await fetch(
      `/api/clients/${post.client_id}/posts/${post.id}/reject`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: rejectComment }),
      }
    );
    setActingId(null);
    if (res.ok) {
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
      setRejectId(null);
      setRejectComment("");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({})) as { error?: { message: string } };
      setErrors({ [post.id]: data?.error?.message ?? "差し戻しに失敗しました" });
    }
  };

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border/60 bg-white/60 backdrop-blur-md py-16">
        <CheckCircle2 className="mb-3 h-10 w-10 text-emerald-400" />
        <p className="text-sm font-semibold text-foreground">承認待ちの投稿はありません</p>
        <p className="mt-1 text-xs text-muted-foreground">お疲れさまです！</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/40 overflow-hidden rounded-2xl border border-border/60 bg-white/60 shadow-sm backdrop-blur-md">
      {posts.map((post) => (
        <div key={post.id} className="p-4">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate font-medium text-foreground">{post.title}</p>
                <Link
                  href={`/clients/${post.client_id}/posts/${post.id}`}
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                  title="投稿を開く"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {post.client_name}
                {post.scheduled_at &&
                  ` • ${new Date(post.scheduled_at).toLocaleString("ja", {
                    month: "numeric",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`}
              </p>
              {errors[post.id] && (
                <p className="mt-1 text-xs text-red-600">{errors[post.id]}</p>
              )}
            </div>

            {rejectId !== post.id && (
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl gap-1.5 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                  onClick={() => { setRejectId(post.id); setRejectComment(""); }}
                  disabled={actingId !== null}
                >
                  <XCircle className="h-3.5 w-3.5" />
                  差し戻し
                </Button>
                <Button
                  size="sm"
                  className="rounded-xl gap-1.5 bg-emerald-500 hover:bg-emerald-600"
                  onClick={() => approve(post)}
                  disabled={actingId !== null}
                >
                  {actingId === post.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                  承認
                </Button>
              </div>
            )}
          </div>

          {/* 差し戻しコメント */}
          {rejectId === post.id && (
            <div className="mt-3 space-y-2 rounded-xl border border-red-100 bg-red-50 p-3">
              <p className="text-xs font-medium text-red-700">差し戻しコメント（任意）</p>
              <Textarea
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
                placeholder="修正してほしい内容を入力してください"
                rows={2}
                className="rounded-lg text-sm"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-lg"
                  onClick={() => setRejectId(null)}
                  disabled={actingId !== null}
                >
                  キャンセル
                </Button>
                <Button
                  size="sm"
                  className="rounded-xl gap-1.5 bg-red-500 hover:bg-red-600"
                  onClick={() => reject(post)}
                  disabled={actingId !== null}
                >
                  {actingId === post.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5" />
                  )}
                  差し戻す
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

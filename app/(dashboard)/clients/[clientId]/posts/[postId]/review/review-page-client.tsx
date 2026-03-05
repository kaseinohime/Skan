"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PostPreviewByType } from "@/components/preview/PostPreviewByType";
import { CommentCard, type CommentItem } from "@/components/review/comment-card";
import { CommentForm } from "@/components/review/comment-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PreviewData } from "@/components/preview/preview-types";
import type { PostPlatform, PostType } from "@/types";

type Props = {
  clientId: string;
  postId: string;
  previewData: PreviewData;
};

function buildCommentsByParent(comments: CommentItem[]): Map<string | null, CommentItem[]> {
  const map = new Map<string | null, CommentItem[]>();
  for (const c of comments) {
    const pid = c.parent_id ?? null;
    if (!map.has(pid)) map.set(pid, []);
    map.get(pid)!.push(c);
  }
  return map;
}

export function ReviewPageClient({
  clientId,
  postId,
  previewData,
}: Props) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [filter, setFilter] = useState<"all" | "open">("all");
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`/api/clients/${clientId}/posts/${postId}/comments`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error?.message ?? "コメントの取得に失敗しました。");
        setComments([]);
        return;
      }
      setComments(Array.isArray(data.comments) ? data.comments : []);
    } finally {
      setLoading(false);
    }
  }, [clientId, postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // 新規コメントの Realtime 購読（同一投稿の INSERT で一覧を再取得）
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`review_comments:${postId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "review_comments",
          filter: `post_id=eq.${postId}`,
        },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId, fetchComments]);

  const byParent = buildCommentsByParent(comments);
  const getReplies = (parentId: string) =>
    (byParent.get(parentId) ?? []).sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  const roots = (byParent.get(null) ?? []).sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  const filteredRoots =
    filter === "open"
      ? roots.filter((r) => r.comment_status === "open")
      : roots;

  const handleResolve = async (id: string, status: "open" | "resolved") => {
    const res = await fetch(
      `/api/clients/${clientId}/posts/${postId}/comments/${id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment_status: status }),
      }
    );
    if (res.ok) await fetchComments();
  };

  const handleCommentSuccess = () => {
    setReplyingToId(null);
    fetchComments();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[340px,1fr]">
      <Card className="lg:sticky lg:top-8 lg:self-start">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">プレビュー</CardTitle>
          <CardDescription>投稿内容の確認</CardDescription>
        </CardHeader>
        <CardContent>
          <PostPreviewByType
            data={previewData}
            platform={previewData.platform as PostPlatform}
            postType={previewData.postType as PostType}
          />
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">コメント</CardTitle>
            <CardDescription>
              修正指示やフィードバックを残せます。対象（画像・動画・キャプション）を指定できます。
            </CardDescription>
            <div className="flex items-center gap-2 pt-2">
              <Select value={filter} onValueChange={(v) => setFilter(v as "all" | "open")}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="open">未対応のみ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <CommentForm
              postId={postId}
              clientId={clientId}
              parentId={null}
              onSuccess={handleCommentSuccess}
            />

            {loading && comments.length === 0 ? (
              <p className="text-sm text-muted-foreground">読み込み中...</p>
            ) : filteredRoots.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {filter === "open" ? "未対応のコメントはありません。" : "まだコメントはありません。"}
              </p>
            ) : (
              <ul className="space-y-3">
                {filteredRoots.map((root) => (
                  <li key={root.id}>
                    <CommentCard
                      comment={root}
                      getReplies={getReplies}
                      onResolve={handleResolve}
                      onReply={setReplyingToId}
                      replyingToId={replyingToId}
                    />
                    {replyingToId === root.id && (
                      <div className="ml-4 mt-2">
                        <CommentForm
                          postId={postId}
                          clientId={clientId}
                          parentId={root.id}
                          onSuccess={handleCommentSuccess}
                          onCancel={() => setReplyingToId(null)}
                        />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

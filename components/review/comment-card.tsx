"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, MessageSquare } from "lucide-react";

export type CommentItem = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  target_type: string | null;
  target_index: number | null;
  target_timestamp_sec: number | null;
  comment_status: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  user_name: string | null;
};

type Props = {
  comment: CommentItem;
  getReplies: (parentId: string) => CommentItem[];
  onResolve: (id: string, status: "open" | "resolved") => void;
  onReply: (parentId: string) => void;
  replyingToId: string | null;
};

const targetLabel: Record<string, string> = {
  image: "画像",
  video: "動画",
  caption: "キャプション",
  general: "全体",
};

export function CommentCard({
  comment,
  getReplies,
  onResolve,
  onReply,
  replyingToId,
}: Props) {
  const replies = getReplies(comment.id);
  const [resolving, setResolving] = useState(false);
  const targetDesc =
    comment.target_type &&
    (comment.target_index != null
      ? `${targetLabel[comment.target_type] ?? comment.target_type} ${comment.target_index + 1}`
      : comment.target_timestamp_sec != null
        ? `動画 ${Math.floor(Number(comment.target_timestamp_sec))}秒`
        : targetLabel[comment.target_type] ?? comment.target_type);

  const handleToggleResolve = async () => {
    setResolving(true);
    const next = comment.comment_status === "open" ? "resolved" : "open";
    try {
      await onResolve(comment.id, next);
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">{comment.user_name ?? "不明"}</span>
        <Badge
          variant={comment.comment_status === "resolved" ? "secondary" : "default"}
          className="text-xs"
        >
          {comment.comment_status === "resolved" ? "対応済み" : "未対応"}
        </Badge>
        {targetDesc && (
          <span className="text-xs text-muted-foreground">{targetDesc}</span>
        )}
        <span className="ml-auto text-xs text-muted-foreground">
          {new Date(comment.created_at).toLocaleString("ja")}
        </span>
      </div>
      <p className="whitespace-pre-wrap text-sm">{comment.content}</p>
      <div className="mt-2 flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggleResolve}
          disabled={resolving}
          className="text-xs"
        >
          <Check className="mr-1 h-3 w-3" />
          {comment.comment_status === "open" ? "対応済みにする" : "未対応に戻す"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onReply(comment.id)}
          className="text-xs"
          disabled={replyingToId === comment.id}
        >
          <MessageSquare className="mr-1 h-3 w-3" />
          返信
        </Button>
      </div>
      {replies.length > 0 && (
        <div className="ml-4 mt-3 border-l-2 border-muted pl-3">
          {replies.map((r) => (
            <CommentCard
              key={r.id}
              comment={r}
              getReplies={getReplies}
              onResolve={onResolve}
              onReply={onReply}
              replyingToId={replyingToId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

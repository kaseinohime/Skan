"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

type TargetType = "image" | "video" | "caption" | "general";

type Props = {
  postId: string;
  clientId: string;
  parentId: string | null;
  onSuccess: () => void;
  onCancel?: () => void;
};

export function CommentForm({
  postId,
  clientId,
  parentId,
  onSuccess,
  onCancel,
}: Props) {
  const [content, setContent] = useState("");
  const [targetType, setTargetType] = useState<TargetType | "">("general");
  const [targetIndex, setTargetIndex] = useState<string>("");
  const [targetTimestampSec, setTargetTimestampSec] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = content.trim();
    if (!trimmed) {
      setError("コメントを入力してください。");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: trimmed,
          target_type: targetType || null,
          target_index: targetIndex !== "" ? parseInt(targetIndex, 10) : null,
          target_timestamp_sec:
            targetTimestampSec !== "" ? parseFloat(targetTimestampSec) : null,
          parent_id: parentId,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error?.message ?? "送信に失敗しました。");
        return;
      }
      setContent("");
      setTargetType("general");
      setTargetIndex("");
      setTargetTimestampSec("");
      onSuccess();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border bg-muted/30 p-4">
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      <div className="space-y-2">
        <Label htmlFor="comment-content">コメント *</Label>
        <Textarea
          id="comment-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="修正指示やフィードバックを入力..."
          rows={3}
          className="resize-none"
        />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="space-y-1">
          <Label>対象</Label>
          <Select
            value={targetType || "general"}
            onValueChange={(v) => setTargetType(v as TargetType)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">全体</SelectItem>
              <SelectItem value="image">画像</SelectItem>
              <SelectItem value="video">動画</SelectItem>
              <SelectItem value="caption">キャプション</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {(targetType === "image" || targetType === "video") && (
          <div className="space-y-1">
            <Label>{targetType === "image" ? "画像番号（1枚目=0）" : "秒数"}</Label>
            <Input
              type="number"
              min={0}
              step={targetType === "video" ? 0.1 : 1}
              value={targetType === "image" ? targetIndex : targetTimestampSec}
              onChange={(e) =>
                targetType === "image"
                  ? setTargetIndex(e.target.value)
                  : setTargetTimestampSec(e.target.value)
              }
              placeholder={targetType === "image" ? "0" : "0.0"}
            />
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? "送信中…" : parentId ? "返信する" : "コメントする"}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            キャンセル
          </Button>
        )}
      </div>
    </form>
  );
}

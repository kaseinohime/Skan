"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type Props = {
  open: boolean;
  onClose: () => void;
  onAdd: (hashtags: string[]) => void;
  caption: string;
};

export function HashtagSuggestDialog({
  open,
  onClose,
  onAdd,
  caption,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hashtags, setHashtags] = useState<string[]>([]);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open) {
      setHashtags([]);
      setError(null);
      el.showModal();
    } else {
      el.close();
    }
  }, [open]);

  const handleGenerate = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/ai/suggest-hashtags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error?.message ?? "提案に失敗しました。");
        setLoading(false);
        return;
      }
      setHashtags(Array.isArray(data?.hashtags) ? data.hashtags : []);
    } catch {
      setError("提案に失敗しました。");
    }
    setLoading(false);
  };

  const addAll = () => {
    const withHash = hashtags.map((t) => (t.startsWith("#") ? t : `#${t}`));
    onAdd(withHash);
    onClose();
  };

  const addOne = (tag: string) => {
    const withHash = tag.startsWith("#") ? tag : `#${tag}`;
    onAdd([withHash]);
    onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      className="w-full max-w-md rounded-lg border bg-background p-0 shadow-lg backdrop:bg-black/50"
      onCancel={onClose}
      onClose={onClose}
    >
      <div className="p-6">
        <h2 className="text-lg font-semibold">ハッシュタグを提案</h2>
        <p className="text-muted-foreground text-sm mt-1">
          キャプションの内容からハッシュタグを提案します。
        </p>

        {hashtags.length === 0 ? (
          <>
            {error && (
              <p className="mt-3 text-sm text-destructive">{error}</p>
            )}
            <div className="mt-6 flex gap-2">
              <Button onClick={handleGenerate} disabled={loading}>
                {loading ? "提案中…" : "ハッシュタグを提案"}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                キャンセル
              </Button>
            </div>
          </>
        ) : (
          <div className="mt-6 space-y-3">
            <Label className="text-sm">提案されたハッシュタグ</Label>
            <div className="flex flex-wrap gap-2">
              {hashtags.map((tag, i) => (
                <Button
                  key={i}
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => addOne(tag)}
                >
                  #{tag.replace(/^#/, "")}
                </Button>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={addAll}>すべて追加</Button>
              <Button type="button" variant="outline" onClick={onClose}>
                閉じる
              </Button>
            </div>
          </div>
        )}
      </div>
    </dialog>
  );
}

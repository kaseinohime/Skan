"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PostType, PostPlatform } from "@/types";

const toneOptions = [
  { value: "カジュアル", label: "カジュアル" },
  { value: "フォーマル", label: "フォーマル" },
  { value: "ポップ", label: "ポップ" },
  { value: "クール", label: "クール" },
  { value: "親しみやすい", label: "親しみやすい" },
];

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (caption: string) => void;
  platform: PostPlatform;
  postType: PostType;
  referenceText?: string;
};

export function CaptionGenerateDialog({
  open,
  onClose,
  onSelect,
  platform,
  postType,
  referenceText = "",
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [theme, setTheme] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [tone, setTone] = useState("カジュアル");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<string[]>([]);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open) {
      setOptions([]);
      setError(null);
      el.showModal();
    } else {
      el.close();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!theme.trim()) {
      setError("テーマを入力してください。");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/ai/generate-caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme: theme.trim(),
          targetAudience: targetAudience.trim() || undefined,
          tone,
          postType,
          platform,
          referenceText: referenceText.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          data?.error?.message ?? "生成に失敗しました。"
        );
        setLoading(false);
        return;
      }
      setOptions(Array.isArray(data?.options) ? data.options : []);
    } catch {
      setError("生成に失敗しました。");
    }
    setLoading(false);
  };

  const handleSelect = (caption: string) => {
    onSelect(caption);
    onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      className="w-full max-w-lg rounded-lg border bg-background p-0 shadow-lg backdrop:bg-black/50"
      onCancel={onClose}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="p-6">
        <h2 className="text-lg font-semibold">AIでキャプションを生成</h2>
        <p className="text-muted-foreground text-sm mt-1">
          テーマやトーンを指定して、3パターンの案を生成します。
        </p>

        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ai-theme">テーマ *</Label>
            <Input
              id="ai-theme"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="例: 春の新作コレクション紹介"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ai-target">ターゲット層（任意）</Label>
            <Input
              id="ai-target"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="例: 20〜30代女性"
            />
          </div>
          <div className="space-y-2">
            <Label>トーン</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {toneOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {error && (
          <p className="mt-3 text-sm text-destructive">{error}</p>
        )}

        {options.length === 0 ? (
          <div className="mt-6 flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "生成中…" : "3パターン生成"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              キャンセル
            </Button>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            <p className="text-sm font-medium">案を選んでキャプションに反映</p>
            {options.map((text, i) => (
              <div
                key={i}
                className="rounded border bg-muted/30 p-3 text-sm"
              >
                <p className="whitespace-pre-wrap">{text}</p>
                <Button
                  type="button"
                  size="sm"
                  className="mt-2"
                  onClick={() => handleSelect(text)}
                >
                  この案を使う
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={onClose} className="mt-2">
              閉じる
            </Button>
          </div>
        )}
      </form>
    </dialog>
  );
}

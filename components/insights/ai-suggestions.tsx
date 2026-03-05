"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Lightbulb, Image, Clock, Hash, TrendingUp } from "lucide-react";
import type { Suggestion, SuggestionCategory, SuggestionPriority } from "@/lib/ai/insights-suggest";

type Props = {
  clientId: string;
  postId: string;
  hasInsights: boolean;
};

const categoryLabel: Record<SuggestionCategory, string> = {
  caption: "キャプション",
  visual: "ビジュアル",
  timing: "投稿時間",
  hashtag: "ハッシュタグ",
  strategy: "戦略",
};

const categoryIcon: Record<SuggestionCategory, React.ReactNode> = {
  caption: <Lightbulb className="h-4 w-4" />,
  visual: <Image className="h-4 w-4" />,
  timing: <Clock className="h-4 w-4" />,
  hashtag: <Hash className="h-4 w-4" />,
  strategy: <TrendingUp className="h-4 w-4" />,
};

const priorityLabel: Record<SuggestionPriority, string> = {
  high: "高",
  medium: "中",
  low: "低",
};

const priorityVariant: Record<
  SuggestionPriority,
  "default" | "secondary" | "outline"
> = {
  high: "default",
  medium: "secondary",
  low: "outline",
};

export function AiSuggestionsPanel({ clientId, postId, hasInsights }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/clients/${clientId}/posts/${postId}/insights/suggest`,
        { method: "POST" }
      );
      const data = await res.json() as { suggestions?: Suggestion[]; error?: { message: string } };
      if (!res.ok) {
        throw new Error(data.error?.message ?? "改善提案の生成に失敗しました。");
      }
      setSuggestions(data.suggestions ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "改善提案の生成に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold">AI改善提案</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={generate}
          disabled={loading || !hasInsights}
          className="gap-1.5"
        >
          <Sparkles className="h-3.5 w-3.5" />
          {loading ? "生成中…" : "提案を生成する"}
        </Button>
      </div>

      {!hasInsights && (
        <p className="text-xs text-muted-foreground">
          インサイトを保存してから改善提案を生成できます。
        </p>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-lg border p-4 animate-pulse space-y-2"
            >
              <div className="h-3 w-24 rounded bg-muted" />
              <div className="h-3 w-full rounded bg-muted" />
              <div className="h-3 w-3/4 rounded bg-muted" />
            </div>
          ))}
        </div>
      )}

      {suggestions && !loading && (
        <div className="space-y-3">
          {suggestions.map((s, i) => (
            <div key={i} className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={priorityVariant[s.priority]} className="text-xs">
                  {priorityLabel[s.priority]}
                </Badge>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  {categoryIcon[s.category]}
                  {categoryLabel[s.category]}
                </span>
                <span className="font-medium text-sm">{s.title}</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

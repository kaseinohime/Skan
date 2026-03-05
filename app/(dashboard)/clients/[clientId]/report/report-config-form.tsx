"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, Download, Sparkles, Loader2 } from "lucide-react";
import type { Suggestion } from "@/lib/ai/insights-suggest";

type Props = {
  clientId: string;
  clientName: string;
};

function prevMonth(year: number, month: number) {
  if (month === 1) return { year: year - 1, month: 12 };
  return { year, month: month - 1 };
}

function nextMonth(year: number, month: number) {
  if (month === 12) return { year: year + 1, month: 1 };
  return { year, month: month + 1 };
}

export function ReportConfigForm({ clientId, clientName }: Props) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [summaryComment, setSummaryComment] = useState("");
  const [nextPlan, setNextPlan] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);

  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const goPrev = () => {
    const p = prevMonth(year, month);
    setYear(p.year);
    setMonth(p.month);
  };
  const goNext = () => {
    const n = nextMonth(year, month);
    setYear(n.year);
    setMonth(n.month);
  };

  // AI総評を生成
  const generateSummaryComment = async () => {
    setGeneratingSummary(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/clients/${clientId}/report/summary-comment`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ year, month }),
        }
      );
      const data = await res.json() as { comment?: string; error?: { message: string } };
      if (!res.ok) throw new Error(data.error?.message ?? "生成に失敗しました。");
      setSummaryComment(data.comment ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "生成に失敗しました。");
    } finally {
      setGeneratingSummary(false);
    }
  };

  // PDFをダウンロード
  const downloadPdf = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/clients/${clientId}/report/generate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            year,
            month,
            summaryComment,
            nextPlan,
            suggestions: suggestions ?? [],
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: { message: string } };
        throw new Error(err.error?.message ?? "PDF生成に失敗しました。");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report_${clientName}_${year}_${String(month).padStart(2, "0")}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "PDF生成に失敗しました。");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 月選択 */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={goPrev}
          className="rounded border p-1.5 hover:bg-muted transition-colors"
          aria-label="前の月"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="min-w-[120px] text-center font-semibold">
          {year}年{month}月
        </span>
        <button
          type="button"
          onClick={goNext}
          className="rounded border p-1.5 hover:bg-muted transition-colors"
          aria-label="次の月"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* 総評コメント */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="summaryComment">総評コメント</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={generateSummaryComment}
            disabled={generatingSummary}
            className="gap-1.5"
          >
            {generatingSummary ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            AIで生成
          </Button>
        </div>
        <Textarea
          id="summaryComment"
          rows={4}
          placeholder="月次の総評・コメントを入力してください（省略可）"
          value={summaryComment}
          onChange={(e) => setSummaryComment(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          このコメントはPDFのサマリーページに掲載されます。
        </p>
      </div>

      {/* 次月方針 */}
      <div className="space-y-2">
        <Label htmlFor="nextPlan">次月の運用方針</Label>
        <Textarea
          id="nextPlan"
          rows={4}
          placeholder="来月の投稿方針・改善施策などを入力してください（省略可）"
          value={nextPlan}
          onChange={(e) => setNextPlan(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          AI改善提案と合わせて最終ページに掲載されます。
        </p>
      </div>

      {/* AI改善提案（任意） */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <Label>AI改善提案</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              {suggestions
                ? `${suggestions.length}件の提案を取得済み`
                : "PDFに含めるAI改善提案を取得します（省略可）"}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={async () => {
              // 最初の投稿のインサイトから提案を取得（簡易版）
              // インサイトダッシュボードページから提案をコピーしてくる場合はスキップ
              setError(null);
              try {
                const res = await fetch(
                  `/api/clients/${clientId}/insights/summary?year=${year}&month=${month}`
                );
                if (!res.ok) throw new Error("データ取得に失敗しました");
                const data = await res.json() as { posts?: { id: string; has_insights: boolean }[] };
                const firstWithInsights = data.posts?.find((p) => p.has_insights);
                if (!firstWithInsights) {
                  setError("インサイトが入力された投稿がありません。");
                  return;
                }
                const sugRes = await fetch(
                  `/api/clients/${clientId}/posts/${firstWithInsights.id}/insights/suggest`,
                  { method: "POST" }
                );
                const sugData = await sugRes.json() as { suggestions?: Suggestion[]; error?: { message: string } };
                if (!sugRes.ok) throw new Error(sugData.error?.message ?? "提案生成に失敗しました");
                setSuggestions(sugData.suggestions ?? []);
              } catch (e) {
                setError(e instanceof Error ? e.message : "提案生成に失敗しました。");
              }
            }}
            className="gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5" />
            提案を取得
          </Button>
        </div>
        {suggestions && (
          <div className="rounded border p-3 space-y-1 text-xs text-muted-foreground">
            {suggestions.map((s, i) => (
              <p key={i}>
                <span className="font-medium text-foreground">{s.title}</span>
                {" — "}{s.body.slice(0, 60)}…
              </p>
            ))}
          </div>
        )}
      </div>

      {/* エラー表示 */}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {/* ダウンロードボタン */}
      <Button
        type="button"
        onClick={downloadPdf}
        disabled={generating}
        className="w-full gap-2"
        size="lg"
      >
        {generating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            PDF生成中…
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            PDFをダウンロード
          </>
        )}
      </Button>
    </div>
  );
}

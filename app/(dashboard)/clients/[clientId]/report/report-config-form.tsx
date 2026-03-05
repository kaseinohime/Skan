"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import type { Suggestion } from "@/lib/ai/insights-suggest";

type PreviewPost = {
  id: string;
  title: string;
  platform: string;
  post_type: string;
  scheduled_at: string | null;
  has_insights: boolean;
  reach: number | null;
  saves: number | null;
};

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

  // 対象投稿プレビュー
  const [previewPosts, setPreviewPosts] = useState<PreviewPost[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // 月が変わったら投稿一覧を取得
  useEffect(() => {
    let cancelled = false;
    setPreviewPosts([]);
    setShowDetails(false);
    setPreviewLoading(true);
    fetch(`/api/clients/${clientId}/insights/summary?year=${year}&month=${month}`)
      .then((r) => r.ok ? r.json() : { posts: [] })
      .then((data: { posts?: PreviewPost[] }) => {
        if (!cancelled) setPreviewPosts(data.posts ?? []);
      })
      .catch(() => { if (!cancelled) setPreviewPosts([]); })
      .finally(() => { if (!cancelled) setPreviewLoading(false); });
    return () => { cancelled = true; };
  }, [clientId, year, month]);

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

  const postsWithInsights = previewPosts.filter((p) => p.has_insights);
  const postsWithoutInsights = previewPosts.filter((p) => !p.has_insights);

  // AI総評を生成
  const generateSummaryComment = async () => {
    setGeneratingSummary(true);
    setError(null);
    try {
      const res = await fetch(`/api/clients/${clientId}/report/summary-comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, month }),
      });
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
      const res = await fetch(`/api/clients/${clientId}/report/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, month, summaryComment, nextPlan, suggestions: suggestions ?? [] }),
      });
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

      {/* 対象投稿プレビュー */}
      <div className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm">
            {previewLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <>
                <span className="font-medium text-foreground">
                  対象投稿 {previewPosts.length}件
                </span>
                <span className="flex items-center gap-1 text-emerald-600">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  インサイト入力済み {postsWithInsights.length}件
                </span>
                {postsWithoutInsights.length > 0 && (
                  <span className="flex items-center gap-1 text-amber-600">
                    <AlertCircle className="h-3.5 w-3.5" />
                    未入力 {postsWithoutInsights.length}件
                  </span>
                )}
              </>
            )}
          </div>
          {previewPosts.length > 0 && (
            <button
              type="button"
              onClick={() => setShowDetails((v) => !v)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              詳細
              {showDetails ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>
          )}
        </div>

        {/* 詳細一覧 */}
        {showDetails && previewPosts.length > 0 && (
          <div className="divide-y divide-border/40 rounded-lg border border-border/40 bg-white/70 overflow-hidden">
            {previewPosts.map((p) => (
              <div key={p.id} className="flex items-center gap-3 px-3 py-2.5">
                {p.has_insights ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
                )}
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/clients/${clientId}/posts/${p.id}`}
                    className="block truncate text-sm font-medium text-foreground hover:underline"
                    target="_blank"
                  >
                    {p.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {p.platform} / {p.post_type}
                    {p.scheduled_at &&
                      ` • ${new Date(p.scheduled_at).toLocaleDateString("ja")}`}
                  </p>
                </div>
                {p.has_insights && (
                  <div className="shrink-0 text-right text-xs text-muted-foreground space-y-0.5">
                    {p.reach != null && <p>リーチ {p.reach.toLocaleString()}</p>}
                    {p.saves != null && <p>保存 {p.saves.toLocaleString()}</p>}
                  </div>
                )}
                {!p.has_insights && (
                  <span className="shrink-0 text-xs text-amber-600">未入力</span>
                )}
              </div>
            ))}
          </div>
        )}

        {!previewLoading && previewPosts.length === 0 && (
          <p className="text-xs text-muted-foreground">
            この月に予定された投稿はありません。
          </p>
        )}
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
              setError(null);
              try {
                const firstWithInsights = previewPosts.find((p) => p.has_insights);
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
      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* ダウンロードボタン */}
      <Button
        type="button"
        onClick={downloadPdf}
        disabled={generating || previewPosts.length === 0}
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
            {postsWithInsights.length > 0 &&
              `（インサイト入力済み ${postsWithInsights.length}件）`}
          </>
        )}
      </Button>
    </div>
  );
}

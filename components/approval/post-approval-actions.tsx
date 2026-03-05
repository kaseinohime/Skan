"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, History } from "lucide-react";

type ApprovalLog = {
  id: string;
  step_order: number;
  step_name: string;
  action: string;
  comment: string | null;
  acted_by: string;
  acted_at: string;
  acted_by_name: string | null;
};

type Props = {
  clientId: string;
  postId: string;
  postStatus: string;
  canApprove: boolean;
  approvalLogs: ApprovalLog[];
  currentStep?: number;
  totalSteps?: number;
};

export function PostApprovalActions({
  clientId,
  postId,
  postStatus,
  canApprove,
  approvalLogs,
  currentStep = 0,
  totalSteps = 0,
}: Props) {
  const router = useRouter();
  const [rejectComment, setRejectComment] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApprove = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/clients/${clientId}/posts/${postId}/approve`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error?.message ?? "承認に失敗しました。");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/clients/${clientId}/posts/${postId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: rejectComment || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error?.message ?? "差し戻しに失敗しました。");
        return;
      }
      setShowRejectInput(false);
      setRejectComment("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const showActions = postStatus === "pending_review" && canApprove;
  const showProgress = postStatus === "pending_review" && totalSteps > 0;

  return (
    <div className="space-y-4">
      {showProgress && (
        <div className="flex items-center gap-3 rounded-md bg-muted/50 border px-4 py-2.5">
          <History className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">
              承認フロー：ステップ {currentStep + 1} / {totalSteps}
            </p>
            <div className="mt-1.5 flex gap-1">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full ${
                    i < currentStep
                      ? "bg-emerald-500"
                      : i === currentStep
                      ? "bg-primary"
                      : "bg-muted-foreground/20"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {showActions && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="h-4 w-4" />
              承認操作
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {error && (
              <p className="rounded border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={handleApprove} disabled={loading} size="sm">
                <Check className="mr-1 h-4 w-4" />
                承認する
              </Button>
              {!showRejectInput ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRejectInput(true)}
                  disabled={loading}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="mr-1 h-4 w-4" />
                  差し戻す
                </Button>
              ) : (
                <div className="flex w-full flex-col gap-2 rounded border p-3">
                  <Label htmlFor="reject-comment">差し戻しコメント（任意）</Label>
                  <Textarea
                    id="reject-comment"
                    value={rejectComment}
                    onChange={(e) => setRejectComment(e.target.value)}
                    placeholder="差し戻し理由を入力..."
                    rows={2}
                    className="resize-none"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleReject}
                      disabled={loading}
                    >
                      差し戻す
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowRejectInput(false);
                        setRejectComment("");
                      }}
                      disabled={loading}
                    >
                      キャンセル
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {approvalLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">承認履歴</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {approvalLogs.map((log) => (
                <li
                  key={log.id}
                  className="flex items-start gap-2 rounded border bg-muted/30 px-3 py-2 text-sm"
                >
                  <span className="shrink-0 font-medium">
                    {log.action === "approved" ? (
                      <span className="text-emerald-600">承認</span>
                    ) : (
                      <span className="text-amber-600">差し戻し</span>
                    )}
                    （{log.step_name}）
                  </span>
                  <span className="text-muted-foreground">
                    {log.acted_by_name ?? log.acted_by} ·{" "}
                    {new Date(log.acted_at).toLocaleString("ja")}
                  </span>
                  {log.comment && (
                    <p className="w-full text-muted-foreground">「{log.comment}」</p>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

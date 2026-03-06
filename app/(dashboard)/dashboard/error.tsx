"use client";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-xl space-y-4 p-8">
      <h1 className="text-xl font-bold text-destructive">ダッシュボードでエラーが発生しました</h1>
      <pre className="rounded bg-muted p-4 text-xs overflow-auto whitespace-pre-wrap">
        {error.message}
        {error.digest ? `\ndigest: ${error.digest}` : ""}
      </pre>
      <button
        onClick={reset}
        className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground"
      >
        再試行
      </button>
    </div>
  );
}

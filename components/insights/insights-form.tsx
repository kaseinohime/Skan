"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DerivedMetricsPanel } from "./derived-metrics-panel";
import { upsertInsightsSchema, type UpsertInsightsInput } from "@/lib/validations/insights";
import type { PostInsights } from "@/types";
import type { InsightsRaw } from "@/lib/insights/metrics";

type Props = {
  clientId: string;
  postId: string;
  initialInsights: PostInsights | null;
  kpiSaveRateTarget?: number;
  kpiHomeRateTarget?: number;
  readonly?: boolean;
};

type FieldDef = {
  name: keyof UpsertInsightsInput;
  label: string;
  hint?: string;
};

const numericFields: FieldDef[] = [
  { name: "followers_count", label: "フォロワー数", hint: "計測時点のフォロワー総数" },
  { name: "reach", label: "リーチ数" },
  { name: "saves", label: "保存数" },
  { name: "follower_reach", label: "フォロワーリーチ数" },
  { name: "non_follower_reach", label: "フォロワー外リーチ数" },
  { name: "profile_visits", label: "プロフアクセス数" },
  { name: "follows", label: "フォロー数" },
  { name: "web_taps", label: "WEBタップ数" },
  { name: "discovery", label: "発見経由数" },
];

function toNumber(v: unknown): number | null {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

export function InsightsForm({
  clientId,
  postId,
  initialInsights,
  kpiSaveRateTarget = 0.02,
  kpiHomeRateTarget = 0.40,
  readonly = false,
}: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  const defaultValues: Partial<UpsertInsightsInput> = {
    followers_count: initialInsights?.followers_count ?? null,
    reach: initialInsights?.reach ?? null,
    saves: initialInsights?.saves ?? null,
    follower_reach: initialInsights?.follower_reach ?? null,
    non_follower_reach: initialInsights?.non_follower_reach ?? null,
    profile_visits: initialInsights?.profile_visits ?? null,
    follows: initialInsights?.follows ?? null,
    web_taps: initialInsights?.web_taps ?? null,
    discovery: initialInsights?.discovery ?? null,
    target_segment: initialInsights?.target_segment ?? "",
    genre: initialInsights?.genre ?? "",
    theme: initialInsights?.theme ?? "",
    memo: initialInsights?.memo ?? "",
  };

  const { register, handleSubmit, watch } = useForm<UpsertInsightsInput>({
    resolver: zodResolver(upsertInsightsSchema),
    defaultValues,
  });

  // リアルタイムプレビュー用に数値を監視
  const watched = watch();
  const liveRaw: InsightsRaw = {
    followers_count: toNumber(watched.followers_count),
    reach: toNumber(watched.reach),
    saves: toNumber(watched.saves),
    follower_reach: toNumber(watched.follower_reach),
    non_follower_reach: toNumber(watched.non_follower_reach),
    profile_visits: toNumber(watched.profile_visits),
    follows: toNumber(watched.follows),
    web_taps: toNumber(watched.web_taps),
    discovery: toNumber(watched.discovery),
  };

  const onSubmit = useCallback(
    async (values: UpsertInsightsInput) => {
      setSaving(true);
      try {
        // 数値フィールドを変換（空文字 → null）
        const payload: Record<string, unknown> = { ...values };
        for (const f of numericFields) {
          payload[f.name] = toNumber(values[f.name]);
        }

        const res = await fetch(
          `/api/clients/${clientId}/posts/${postId}/insights`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.error?.message ?? "保存に失敗しました。");
        }
        setSaveStatus("success");
        setSaveError(null);
        router.refresh();
        setTimeout(() => setSaveStatus("idle"), 3000);
      } catch (e) {
        setSaveStatus("error");
        setSaveError(e instanceof Error ? e.message : "保存に失敗しました。");
      } finally {
        setSaving(false);
      }
    },
    [clientId, postId, router]
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-2">
        {/* 左: 数値入力 */}
        <div className="space-y-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            基本数値
          </p>
          <div className="grid grid-cols-2 gap-3">
            {numericFields.map((f) => (
              <div key={f.name} className="space-y-1">
                <Label htmlFor={f.name} className="text-sm">
                  {f.label}
                </Label>
                {f.hint && (
                  <p className="text-xs text-muted-foreground">{f.hint}</p>
                )}
                <Input
                  id={f.name}
                  type="number"
                  min={0}
                  placeholder="—"
                  disabled={readonly}
                  {...register(f.name, { valueAsNumber: false })}
                  className="tabular-nums"
                />
              </div>
            ))}
          </div>
        </div>

        {/* 右: 派生指標 */}
        <div className="space-y-4">
          <DerivedMetricsPanel
            raw={liveRaw}
            kpiSaveRateTarget={kpiSaveRateTarget}
            kpiHomeRateTarget={kpiHomeRateTarget}
          />
        </div>
      </div>

      {/* 分析メモ */}
      <div className="space-y-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          分析メモ
        </p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="space-y-1">
            <Label htmlFor="target_segment">ターゲット</Label>
            <Input
              id="target_segment"
              placeholder="20代女性・転職希望者 等"
              disabled={readonly}
              {...register("target_segment")}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="genre">ジャンル</Label>
            <Input
              id="genre"
              placeholder="TIPS・採用 等"
              disabled={readonly}
              {...register("genre")}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="theme">テーマ</Label>
            <Input
              id="theme"
              placeholder="海外貿易・転職成功 等"
              disabled={readonly}
              {...register("theme")}
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="memo">仮説・フィードバックメモ</Label>
          <Textarea
            id="memo"
            rows={4}
            placeholder="伸びた理由・次回への仮説・クライアントからのFB等"
            disabled={readonly}
            {...register("memo")}
          />
        </div>
      </div>

      {!readonly && (
        <div className="space-y-2">
          {saveStatus === "success" && (
            <p className="text-sm text-emerald-600 font-medium rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2">
              保存しました。ページ下部の「AI改善提案」で改善ヒントを生成できます。
            </p>
          )}
          {saveStatus === "error" && (
            <p className="text-sm text-red-600">{saveError ?? "保存に失敗しました。"}</p>
          )}
          <div className="flex justify-end">
            <Button type="submit" disabled={saving} className="min-w-[140px]">
              {saving ? "保存中…" : "インサイスを保存"}
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}

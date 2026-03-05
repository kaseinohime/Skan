"use client";

import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { PLAN_PRESETS, type SubscriptionPlan } from "@/lib/ai/rate-limit";
import { Check, Loader2 } from "lucide-react";

type OrgBilling = {
  subscription_plan: string;
  ai_window_hours: number;
  ai_limit_per_window: number;
  client_limit: number | null;
};

type Props = {
  orgId: string;
  current: OrgBilling;
};

// 実際の価格表に合わせたラベル
const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  free:       "Free（無料）",
  starter:    "Starter — ¥4,980/月",
  standard:   "Standard — ¥12,800/月",
  pro:        "Pro — ¥24,800/月",
  enterprise: "Enterprise（カスタム契約）",
  custom:     "カスタム（手動設定）",
};

const WINDOW_OPTIONS = [
  { value: 1,   label: "1時間" },
  { value: 6,   label: "6時間" },
  { value: 24,  label: "24時間（1日）" },
  { value: 72,  label: "72時間（3日）" },
  { value: 168, label: "168時間（1週間）" },
  { value: 360, label: "360時間（15日）" },
  { value: 720, label: "720時間（30日）" },
];

export function BillingSettingsForm({ orgId, current }: Props) {
  const [plan, setPlan] = useState<SubscriptionPlan>(
    (current.subscription_plan as SubscriptionPlan) ?? "free"
  );
  const [windowHours, setWindowHours] = useState(current.ai_window_hours);
  const [limitPerWindow, setLimitPerWindow] = useState(current.ai_limit_per_window);
  const [clientLimit, setClientLimit] = useState<number | null>(current.client_limit);
  const [unlimitedClients, setUnlimitedClients] = useState(current.client_limit === null);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCustom = plan === "custom";

  const handlePlanChange = (p: SubscriptionPlan) => {
    setPlan(p);
    if (p !== "custom") {
      const preset = PLAN_PRESETS[p]!;
      setWindowHours(preset.ai_window_hours);
      setLimitPerWindow(preset.ai_limit_per_window);
      setClientLimit(preset.client_limit);
      setUnlimitedClients(preset.client_limit === null);
    }
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const body: Record<string, unknown> = { subscription_plan: plan };
      if (isCustom) {
        body.ai_window_hours = windowHours;
        body.ai_limit_per_window = limitPerWindow;
        body.client_limit = unlimitedClients ? null : clientLimit;
      }
      const res = await fetch(`/api/master/organizations/${orgId}/billing`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json() as { error?: { message: string } };
      if (!res.ok) throw new Error(data.error?.message ?? "保存に失敗しました。");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  };

  // 現在の有効値を表示するサマリー
  const effectiveWindow = isCustom ? windowHours : (PLAN_PRESETS[plan]?.ai_window_hours ?? windowHours);
  const effectiveLimit = isCustom ? limitPerWindow : (PLAN_PRESETS[plan]?.ai_limit_per_window ?? limitPerWindow);
  const effectiveClientLimit = isCustom
    ? (unlimitedClients ? null : clientLimit)
    : PLAN_PRESETS[plan]?.client_limit ?? null;

  return (
    <div className="space-y-5">
      {/* プラン選択 */}
      <div className="space-y-1.5">
        <Label>課金プラン（手動設定 / 請求は発生しません）</Label>
        <Select value={plan} onValueChange={(v) => handlePlanChange(v as SubscriptionPlan)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(PLAN_LABELS) as SubscriptionPlan[]).map((p) => (
              <SelectItem key={p} value={p}>
                {PLAN_LABELS[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          マスターによる手動変更のため、Stripe上の請求には影響しません。
        </p>
      </div>

      {/* カスタム設定（プランがcustomのときのみ編集可能） */}
      <div className={`space-y-4 rounded-lg border p-4 ${isCustom ? "" : "opacity-60"}`}>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          AI制限設定
          {!isCustom && <span className="ml-2 normal-case font-normal">（プリセット値）</span>}
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="window">ウィンドウ（時間）</Label>
            {isCustom ? (
              <Select
                value={String(windowHours)}
                onValueChange={(v) => setWindowHours(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WINDOW_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={String(o.value)}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="flex h-10 items-center rounded-md border bg-muted px-3 text-sm">
                {WINDOW_OPTIONS.find((o) => o.value === effectiveWindow)?.label ?? `${effectiveWindow}時間`}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="limit">ウィンドウ内の上限回数（0=無制限）</Label>
            {isCustom ? (
              <Input
                id="limit"
                type="number"
                min={0}
                value={limitPerWindow}
                onChange={(e) => setLimitPerWindow(Number(e.target.value))}
              />
            ) : (
              <div className="flex h-10 items-center rounded-md border bg-muted px-3 text-sm">
                {effectiveLimit === 0 ? "無制限" : `${effectiveLimit}回`}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>クライアント数上限</Label>
          {isCustom ? (
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={unlimitedClients}
                  onChange={(e) => {
                    setUnlimitedClients(e.target.checked);
                    if (e.target.checked) setClientLimit(null);
                  }}
                  className="rounded"
                />
                無制限
              </label>
              {!unlimitedClients && (
                <Input
                  type="number"
                  min={0}
                  className="w-24"
                  value={clientLimit ?? ""}
                  onChange={(e) => setClientLimit(Number(e.target.value))}
                  placeholder="例: 5"
                />
              )}
            </div>
          ) : (
            <div className="flex h-10 items-center rounded-md border bg-muted px-3 text-sm">
              {effectiveClientLimit === null ? "無制限" : `${effectiveClientLimit}クライアント`}
            </div>
          )}
        </div>
      </div>

      {/* 設定サマリー */}
      <div className="flex flex-wrap gap-2 text-xs">
        <Badge variant="outline">
          AI: {effectiveLimit === 0 ? "無制限" : `${effectiveLimit}回`} / {WINDOW_OPTIONS.find((o) => o.value === effectiveWindow)?.label ?? `${effectiveWindow}時間`}
        </Badge>
        <Badge variant="outline">
          クライアント: {effectiveClientLimit === null ? "無制限" : `最大${effectiveClientLimit}`}
        </Badge>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-3">
        {saved && (
          <span className="flex items-center gap-1 text-sm text-emerald-600">
            <Check className="h-4 w-4" />
            保存しました
          </span>
        )}
        <Button onClick={save} disabled={saving} className="ml-auto">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          保存する
        </Button>
      </div>
    </div>
  );
}

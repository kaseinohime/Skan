"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Loader2, Plus, Trash2 } from "lucide-react";
import type { AccountSettingsInput } from "@/lib/validations/insights";

type HashtagSet = { label: string; tags: string[] };
type AccountEntry = { url: string; note: string };

type Props = {
  clientId: string;
  initial: (AccountSettingsInput & { id?: string }) | null;
  readOnly: boolean;
};

export function AccountSettingsForm({ clientId, initial, readOnly }: Props) {
  const router = useRouter();

  const [profileText, setProfileText] = useState(initial?.profile_text ?? "");
  const [captionTemplate, setCaptionTemplate] = useState(initial?.caption_template ?? "");
  const [persona, setPersona] = useState(initial?.persona ?? "");
  const [kpiSaveRate, setKpiSaveRate] = useState(
    initial?.kpi_save_rate_target != null
      ? String(Math.round((initial.kpi_save_rate_target as number) * 100))
      : "2"
  );
  const [kpiHomeRate, setKpiHomeRate] = useState(
    initial?.kpi_home_rate_target != null
      ? String(Math.round((initial.kpi_home_rate_target as number) * 100))
      : "40"
  );
  const [benchmarkAccounts, setBenchmarkAccounts] = useState<AccountEntry[]>(
    (initial?.benchmark_accounts as AccountEntry[]) ?? []
  );
  const [competitorAccounts, setCompetitorAccounts] = useState<AccountEntry[]>(
    (initial?.competitor_accounts as AccountEntry[]) ?? []
  );
  const [hashtagSets, setHashtagSets] = useState<HashtagSet[]>(
    (initial?.hashtag_sets as HashtagSet[]) ?? []
  );
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus("idle");
    setSaveError(null);
    try {
      const body: AccountSettingsInput = {
        profile_text: profileText || null,
        caption_template: captionTemplate || null,
        persona: persona || null,
        kpi_save_rate_target: parseFloat(kpiSaveRate) / 100 || 0.02,
        kpi_home_rate_target: parseFloat(kpiHomeRate) / 100 || 0.4,
        hashtag_sets: hashtagSets,
        benchmark_accounts: benchmarkAccounts,
        competitor_accounts: competitorAccounts,
      };
      const res = await fetch(`/api/clients/${clientId}/account-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: { message: string } };
        throw new Error(data.error?.message ?? "保存に失敗しました。");
      }
      setSaveStatus("success");
      router.refresh();
    } catch (e) {
      setSaveStatus("error");
      setSaveError(e instanceof Error ? e.message : "保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  };

  const addAccount = (setter: React.Dispatch<React.SetStateAction<AccountEntry[]>>) => {
    setter((prev) => [...prev, { url: "", note: "" }]);
  };
  const removeAccount = (
    setter: React.Dispatch<React.SetStateAction<AccountEntry[]>>,
    index: number
  ) => {
    setter((prev) => prev.filter((_, i) => i !== index));
  };
  const updateAccount = (
    setter: React.Dispatch<React.SetStateAction<AccountEntry[]>>,
    index: number,
    field: "url" | "note",
    value: string
  ) => {
    setter((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const addHashtagSet = () => {
    setHashtagSets((prev) => [...prev, { label: "", tags: [] }]);
  };
  const removeHashtagSet = (index: number) => {
    setHashtagSets((prev) => prev.filter((_, i) => i !== index));
  };
  const updateHashtagSet = (index: number, field: "label" | "tagsStr", value: string) => {
    setHashtagSets((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        if (field === "label") return { ...item, label: value };
        return {
          ...item,
          tags: value
            .split(/[\s,]+/)
            .map((t) => t.replace(/^#/, "").trim())
            .filter(Boolean),
        };
      })
    );
  };

  return (
    <div className="space-y-8">
      {/* アカウント基本情報 */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold">アカウント基本情報</h2>
        <div className="space-y-2">
          <Label htmlFor="profileText">プロフィール文</Label>
          <Textarea
            id="profileText"
            rows={3}
            placeholder="Instagramのプロフィール文を入力"
            value={profileText}
            onChange={(e) => setProfileText(e.target.value)}
            disabled={readOnly}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="captionTemplate">キャプションテンプレート</Label>
          <Textarea
            id="captionTemplate"
            rows={4}
            placeholder="定型キャプションのひな形"
            value={captionTemplate}
            onChange={(e) => setCaptionTemplate(e.target.value)}
            disabled={readOnly}
          />
        </div>
      </section>

      <Separator />

      {/* ハッシュタグセット */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">ハッシュタグセット</h2>
          {!readOnly && (
            <Button type="button" variant="outline" size="sm" onClick={addHashtagSet}>
              <Plus className="mr-1 h-3.5 w-3.5" />
              追加
            </Button>
          )}
        </div>
        {hashtagSets.length === 0 && (
          <p className="text-sm text-muted-foreground">登録されたハッシュタグセットがありません。</p>
        )}
        {hashtagSets.map((set, i) => (
          <div key={i} className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Input
                placeholder="セット名（例: メイン投稿用）"
                value={set.label}
                onChange={(e) => updateHashtagSet(i, "label", e.target.value)}
                disabled={readOnly}
                className="flex-1"
              />
              {!readOnly && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeHashtagSet(i)}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              )}
            </div>
            <Textarea
              rows={2}
              placeholder="#ハッシュタグ スペースかカンマ区切りで入力"
              value={set.tags.map((t) => `#${t}`).join(" ")}
              onChange={(e) => updateHashtagSet(i, "tagsStr", e.target.value)}
              disabled={readOnly}
            />
            {set.tags.length > 0 && (
              <p className="text-xs text-muted-foreground">{set.tags.length}個のタグ</p>
            )}
          </div>
        ))}
      </section>

      <Separator />

      {/* アカウント設計 */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold">アカウント設計</h2>
        <div className="space-y-2">
          <Label htmlFor="persona">アカウントペルソナ</Label>
          <Textarea
            id="persona"
            rows={5}
            placeholder="ターゲット像・投稿の世界観・ブランドガイドラインなど"
            value={persona}
            onChange={(e) => setPersona(e.target.value)}
            disabled={readOnly}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="kpiSaveRate">保存率 KPI目標（%）</Label>
            <Input
              id="kpiSaveRate"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={kpiSaveRate}
              onChange={(e) => setKpiSaveRate(e.target.value)}
              disabled={readOnly}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kpiHomeRate">ホーム率 KPI目標（%）</Label>
            <Input
              id="kpiHomeRate"
              type="number"
              min="0"
              max="100"
              step="1"
              value={kpiHomeRate}
              onChange={(e) => setKpiHomeRate(e.target.value)}
              disabled={readOnly}
            />
          </div>
        </div>
      </section>

      <Separator />

      {/* ベンチマーク・競合アカウント */}
      <section className="space-y-6">
        <h2 className="text-base font-semibold">ベンチマーク・競合アカウント</h2>

        {/* ベンチマーク */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>ベンチマークアカウント</Label>
            {!readOnly && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addAccount(setBenchmarkAccounts)}
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                追加
              </Button>
            )}
          </div>
          {benchmarkAccounts.length === 0 && (
            <p className="text-sm text-muted-foreground">ベンチマークアカウントが未登録です。</p>
          )}
          {benchmarkAccounts.map((acc, i) => (
            <div key={i} className="flex gap-2">
              <Input
                placeholder="URL（Instagram/TikTok）"
                value={acc.url}
                onChange={(e) => updateAccount(setBenchmarkAccounts, i, "url", e.target.value)}
                disabled={readOnly}
                className="flex-1"
              />
              <Input
                placeholder="メモ"
                value={acc.note}
                onChange={(e) => updateAccount(setBenchmarkAccounts, i, "note", e.target.value)}
                disabled={readOnly}
                className="w-40"
              />
              {!readOnly && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeAccount(setBenchmarkAccounts, i)}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* 競合 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>競合アカウント</Label>
            {!readOnly && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addAccount(setCompetitorAccounts)}
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                追加
              </Button>
            )}
          </div>
          {competitorAccounts.length === 0 && (
            <p className="text-sm text-muted-foreground">競合アカウントが未登録です。</p>
          )}
          {competitorAccounts.map((acc, i) => (
            <div key={i} className="flex gap-2">
              <Input
                placeholder="URL（Instagram/TikTok）"
                value={acc.url}
                onChange={(e) => updateAccount(setCompetitorAccounts, i, "url", e.target.value)}
                disabled={readOnly}
                className="flex-1"
              />
              <Input
                placeholder="メモ"
                value={acc.note}
                onChange={(e) => updateAccount(setCompetitorAccounts, i, "note", e.target.value)}
                disabled={readOnly}
                className="w-40"
              />
              {!readOnly && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeAccount(setCompetitorAccounts, i)}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 保存ボタン */}
      {!readOnly && (
        <>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm">
              {saveStatus === "success" && (
                <p className="text-green-600">保存しました。</p>
              )}
              {saveStatus === "error" && (
                <p className="text-red-600">{saveError}</p>
              )}
            </div>
            <Button type="button" onClick={handleSave} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              保存する
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

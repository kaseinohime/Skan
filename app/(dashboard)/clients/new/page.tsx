"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowUpRight } from "lucide-react";

export default function NewClientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [planLimitHit, setPlanLimitHit] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [instagramUsername, setInstagramUsername] = useState("");
  const [tiktokUsername, setTiktokUsername] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPlanLimitHit(false);
    setLoading(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          instagram_username: instagramUsername.trim() || undefined,
          tiktok_username: tiktokUsername.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({})) as { client?: { id: string }; error?: { code: string; message: string } };
      if (!res.ok) {
        if (data?.error?.code === "PLAN_LIMIT") {
          setPlanLimitHit(true);
        } else {
          setError(data?.error?.message ?? "作成に失敗しました。");
        }
        setLoading(false);
        return;
      }
      router.push(`/clients/${data.client!.id}`);
      router.refresh();
    } catch {
      setError("通信エラーが発生しました。");
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-black text-foreground">クライアント新規作成</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          ワークスペースとして管理するクライアントを追加します
        </p>
      </div>

      {planLimitHit && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="font-semibold text-amber-800">プランの上限に達しました</p>
          <p className="mt-1 text-sm text-amber-700">
            現在のプランでは作成できるクライアント数の上限に達しています。
            プランをアップグレードすると上限が増えます。
          </p>
          <Button asChild size="sm" className="mt-3 rounded-xl gap-1.5">
            <Link href="/settings/billing">
              プランをアップグレード
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="rounded-2xl border border-border/60 bg-white/60 backdrop-blur-md p-6 shadow-sm space-y-5">
        {error && (
          <p className="text-sm text-red-600" role="alert">{error}</p>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="name">クライアント名 <span className="text-destructive">*</span></Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例: サンプル株式会社"
            required
            disabled={loading}
            className="rounded-xl"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">説明（任意）</Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="クライアントの概要"
            disabled={loading}
            className="rounded-xl"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="instagram">Instagram ユーザー名（任意）</Label>
          <Input
            id="instagram"
            value={instagramUsername}
            onChange={(e) => setInstagramUsername(e.target.value)}
            placeholder="username（@不要）"
            disabled={loading}
            className="rounded-xl"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="tiktok">TikTok ユーザー名（任意）</Label>
          <Input
            id="tiktok"
            value={tiktokUsername}
            onChange={(e) => setTiktokUsername(e.target.value)}
            placeholder="username（@不要）"
            disabled={loading}
            className="rounded-xl"
          />
        </div>

        <div className="flex gap-3 pt-1">
          <Button type="submit" disabled={loading} className="rounded-xl">
            {loading ? "作成中…" : "作成する"}
          </Button>
          <Button type="button" variant="outline" className="rounded-xl" asChild>
            <Link href="/clients">キャンセル</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function NewClientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [instagramUsername, setInstagramUsername] = useState("");
  const [tiktokUsername, setTiktokUsername] = useState("");

  const handleSlugFromName = () => {
    const s = name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    setSlug(s || "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim() || undefined,
          description: description.trim() || undefined,
          instagram_username: instagramUsername.trim() || undefined,
          tiktok_username: tiktokUsername.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error?.message ?? "作成に失敗しました。");
        setLoading(false);
        return;
      }
      router.push(`/clients/${data.client.id}`);
      router.refresh();
    } catch {
      setError("通信エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-lg space-y-8 p-8">
      <div>
        <h1 className="text-2xl font-bold">クライアント新規作成</h1>
        <p className="text-muted-foreground">
          ワークスペースとして管理するクライアントを追加します
        </p>
      </div>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>基本情報</CardTitle>
            <CardDescription>名前とスラッグは後から変更できます</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <p className="text-destructive text-sm" role="alert">
                {error}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">クライアント名 *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={handleSlugFromName}
                placeholder="例: サンプル株式会社"
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">スラッグ *</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="例: sample-corp"
                required
                disabled={loading}
              />
              <p className="text-muted-foreground text-xs">
                英小文字・数字・ハイフンのみ。URL等で使用します。
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">説明（任意）</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="クライアントの概要"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram ユーザー名（任意）</Label>
              <Input
                id="instagram"
                value={instagramUsername}
                onChange={(e) => setInstagramUsername(e.target.value)}
                placeholder="username"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tiktok">TikTok ユーザー名（任意）</Label>
              <Input
                id="tiktok"
                value={tiktokUsername}
                onChange={(e) => setTiktokUsername(e.target.value)}
                placeholder="username"
                disabled={loading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex gap-4">
            <Button type="submit" disabled={loading}>
              {loading ? "作成中…" : "作成する"}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/clients">キャンセル</Link>
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

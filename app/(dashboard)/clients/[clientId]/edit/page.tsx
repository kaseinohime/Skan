"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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
import { AssigneesEditor } from "@/components/assignees-editor";

export default function EditClientPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.clientId as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [instagramUsername, setInstagramUsername] = useState("");
  const [tiktokUsername, setTiktokUsername] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [assignableUsers, setAssignableUsers] = useState<{ id: string; full_name: string; email: string }[]>([]);

  useEffect(() => {
    fetch(`/api/clients/${clientId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        const c = data.client;
        setName(c.name ?? "");
        setDescription(c.description ?? "");
        setInstagramUsername(c.instagram_username ?? "");
        setTiktokUsername(c.tiktok_username ?? "");
        setIsActive(c.is_active ?? true);
      })
      .catch(() => setError("クライアントを取得できませんでした。"))
      .finally(() => setLoading(false));
  }, [clientId]);

  useEffect(() => {
    fetch(`/api/clients/${clientId}/assignable-users`)
      .then((res) => (res.ok ? res.json() : { users: [] }))
      .then((data) => setAssignableUsers(data.users ?? []))
      .catch(() => setAssignableUsers([]));
  }, [clientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          instagram_username: instagramUsername.trim() || null,
          tiktok_username: tiktokUsername.trim() || null,
          is_active: isActive,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error?.message ?? "更新に失敗しました。");
        setSaving(false);
        return;
      }
      router.push(`/clients/${clientId}`);
      router.refresh();
    } catch {
      setError("通信エラーが発生しました。");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-lg space-y-8 p-8">
        <p className="text-muted-foreground">読み込み中…</p>
      </div>
    );
  }

  if (error && !name) {
    return (
      <div className="container mx-auto max-w-lg space-y-8 p-8">
        <p className="text-destructive">{error}</p>
        <Button asChild variant="outline">
          <Link href="/clients">一覧へ戻る</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-lg space-y-8 p-8">
      <div>
        <h1 className="text-2xl font-bold">クライアント編集</h1>
        <p className="text-muted-foreground">{name || "クライアント"}の設定を変更します</p>
      </div>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>基本情報</CardTitle>
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
                required
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">説明（任意）</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram ユーザー名</Label>
              <Input
                id="instagram"
                value={instagramUsername}
                onChange={(e) => setInstagramUsername(e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tiktok">TikTok ユーザー名</Label>
              <Input
                id="tiktok"
                value={tiktokUsername}
                onChange={(e) => setTiktokUsername(e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                disabled={saving}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="isActive">有効</Label>
            </div>
          </CardContent>
          <CardFooter className="flex gap-4">
            <Button type="submit" disabled={saving}>
              {saving ? "保存中…" : "保存"}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href={`/clients/${clientId}`}>キャンセル</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>担当者（ディレクター・編集者）</CardTitle>
            <CardDescription>
              複数人を設定できます。下の企画・投稿にデフォルトで引き継がれます
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AssigneesEditor
              assigneesApiBase={`/api/clients/${clientId}`}
              assignableUsers={assignableUsers}
              disabled={saving}
              onSave={() => router.refresh()}
            />
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

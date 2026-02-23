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

export function CreateOrganizationForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/master/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug: slug || name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
          description: description || undefined,
          admin_email: adminEmail,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error?.message ?? "作成に失敗しました。");
        setLoading(false);
        return;
      }
      router.push(`/master/organizations/${data.id}`);
      router.refresh();
    } catch {
      setError("通信エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  const suggestSlug = () => {
    if (name && !slug) {
      setSlug(
        name
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "") || ""
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>新規企業</CardTitle>
        <CardDescription>
          企業情報と管理者のメールアドレスを入力してください。招待メールが送信されます。
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">企業名</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={suggestSlug}
              placeholder="例: 株式会社サンプル"
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">スラグ（URL用・英小文字・数字・ハイフンのみ）</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="例: sample-inc"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">説明（任意）</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="任意"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin_email">管理者メールアドレス（招待送信先）</Label>
            <Input
              id="admin_email"
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              placeholder="admin@example.com"
              required
              disabled={loading}
            />
          </div>
        </CardContent>
        <CardFooter className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? "作成・招待送信中…" : "作成して招待メールを送信"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/master/organizations">キャンセル</Link>
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

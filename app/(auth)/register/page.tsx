"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
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

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const next = searchParams.get("next") ?? "/dashboard";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();

      // 1. パスワードと表示名をメタデータに設定
      const { data: userData, error: updateError } = await supabase.auth.updateUser({
        password,
        data: { full_name: fullName },
      });
      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }

      // 2. users テーブルの full_name を更新（トリガーは INSERT 時のみ動作するため）
      if (userData.user) {
        await supabase
          .from("users")
          .update({ full_name: fullName })
          .eq("id", userData.user.id);
      }

      // 3. 招待完了処理（organization_members / client_members への追加）
      await fetch("/api/auth/complete-invitation", { method: "POST" });

      router.refresh();
      router.push(next);
    } catch {
      setError("設定に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>アカウント設定</CardTitle>
        <CardDescription>
          パスワードと表示名を設定してください
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
            <Label htmlFor="fullName">表示名</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="山田 太郎"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              autoComplete="name"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">パスワード</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              disabled={loading}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "設定中…" : "設定してログイン"}
          </Button>
          <Button asChild variant="ghost" className="w-full">
            <Link href="/login">すでにアカウントがある場合</Link>
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<Card className="w-full max-w-sm"><CardContent className="p-6">読み込み中…</CardContent></Card>}>
      <RegisterForm />
    </Suspense>
  );
}

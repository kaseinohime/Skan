"use client";

import { Suspense, useState, useEffect } from "react";
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
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isInviteFlow, setIsInviteFlow] = useState<boolean | null>(null);

  const next = searchParams.get("next") ?? "/dashboard";

  useEffect(() => {
    const check = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setEmail(user.email);
        setIsInviteFlow(true);
      } else {
        setIsInviteFlow(false);
      }
    };
    check();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();

      if (isInviteFlow) {
        // 招待フロー: パスワードと表示名を設定
        const { data: userData, error: updateError } = await supabase.auth.updateUser({
          password,
          data: { full_name: fullName },
        });
        if (updateError) {
          setError(updateError.message);
          setLoading(false);
          return;
        }
        if (userData.user) {
          await supabase
            .from("users")
            .update({ full_name: fullName })
            .eq("id", userData.user.id);
        }
        await fetch("/api/auth/complete-invitation", { method: "POST" });
      } else {
        // 新規サインアップ: メール・パスワード・表示名で登録
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: fullName.trim() },
          },
        });
        if (signUpError) {
          const msg = signUpError.message;
          if (msg.includes("already registered") || msg.includes("already been registered")) {
            setError("このメールアドレスは既に登録されています。ログインしてください。");
          } else {
            setError(msg);
          }
          setLoading(false);
          return;
        }
        if (signUpData.user?.identities?.length === 0) {
          setError("このメールアドレスは既に登録されています。ログインしてください。");
          setLoading(false);
          return;
        }
        router.refresh();
        router.push(next);
        return;
      }

      router.refresh();
      router.push(next);
    } catch {
      setError("設定に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  if (isInviteFlow === null) {
    return (
      <Card className="w-full max-w-sm">
        <CardContent className="p-6">読み込み中…</CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{isInviteFlow ? "アカウント設定" : "新規登録"}</CardTitle>
        <CardDescription>
          {isInviteFlow
            ? "パスワードと表示名を設定してください"
            : "メールアドレス・パスワード・表示名を入力してください"}
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
            <Label htmlFor="email">メールアドレス</Label>
            <Input
              id="email"
              type="email"
              placeholder="example@example.co.jp"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={loading || isInviteFlow}
              readOnly={isInviteFlow}
            />
            {isInviteFlow && (
              <p className="text-muted-foreground text-xs">招待時のメールアドレスです</p>
            )}
          </div>
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
              placeholder={isInviteFlow ? undefined : "6文字以上"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={isInviteFlow ? "new-password" : "new-password"}
              disabled={loading}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading
              ? "処理中…"
              : isInviteFlow
                ? "設定してログイン"
                : "登録する"}
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

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

const SAFE_NEXT_PATHS = ["/dashboard", "/master", "/clients", "/approval"];
function isSafeNext(next: string | null): boolean {
  if (!next || !next.startsWith("/")) return false;
  return SAFE_NEXT_PATHS.some((p) => next === p || next.startsWith(p + "/"));
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        setError(signInError.message === "Invalid login credentials" ? "メールアドレスまたはパスワードが正しくありません。" : signInError.message);
        setLoading(false);
        return;
      }
      router.refresh();
      router.push(isSafeNext(nextPath) && nextPath ? nextPath : "/dashboard");
    } catch {
      setError("ログインに失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>ログイン</CardTitle>
        <CardDescription>エスカンにログインしてください</CardDescription>
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
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
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
              autoComplete="current-password"
              disabled={loading}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "ログイン中…" : "ログイン"}
          </Button>
          <div className="flex flex-col gap-1 text-center text-sm">
            <Link
              href="/forgot-password"
              className="text-primary hover:underline"
            >
              パスワードを忘れた場合
            </Link>
            <Link href="/" className="text-muted-foreground hover:underline">
              トップへ戻る
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<Card className="w-full max-w-sm"><CardContent className="p-6">読み込み中…</CardContent></Card>}>
      <LoginForm />
    </Suspense>
  );
}

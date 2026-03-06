"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";

function AuthConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    const next = searchParams.get("next") ?? "/register";

    // SIGNED_IN イベントを確認してからリダイレクト（Cookie書き込み完了を保証）
    // SIGNED_IN 後はダッシュボードへ。組織作成はダッシュボードのサーバー側で行う。
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (cancelled) return;
        if ((event === "SIGNED_IN" || event === "PASSWORD_RECOVERY") && session) {
          subscription.unsubscribe();
          router.replace(next);
        }
      }
    );

    const run = async () => {
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type");

      // パターン1: token_hash パラメータあり（PKCE / Email OTP フロー）
      if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as "invite" | "email" | "recovery",
        });
        if (!cancelled && error) {
          setErrorMessage(error.message);
          subscription.unsubscribe();
        }
        // 成功時は onAuthStateChange の SIGNED_IN で自動リダイレクト
        return;
      }

      // パターン2: URL フラグメントあり（implicit flow / Supabase サーバー経由リダイレクト）
      if (typeof window !== "undefined" && window.location.hash) {
        const params = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (!cancelled && error) {
            setErrorMessage(error.message);
            subscription.unsubscribe();
          }
          // 成功時は onAuthStateChange の SIGNED_IN で自動リダイレクト
          return;
        }
      }

      // トークンなし
      if (!cancelled) {
        setErrorMessage("トークンがありません。招待リンクから再度アクセスしてください。");
        subscription.unsubscribe();
      }
    };

    run();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [searchParams, router]);

  if (errorMessage) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-6 space-y-2">
            <p className="text-destructive text-sm">{errorMessage}</p>
            <a href="/login" className="text-primary inline-block text-sm underline">
              ログインページへ
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-sm">認証を確認しています…</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Card className="w-full max-w-sm">
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-sm">読み込み中…</p>
            </CardContent>
          </Card>
        </div>
      }
    >
      <AuthConfirmContent />
    </Suspense>
  );
}

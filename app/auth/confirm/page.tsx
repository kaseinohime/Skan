"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";

function AuthConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type");
      const next = searchParams.get("next") ?? "/register";

      const supabase = createClient();

      if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as "invite" | "email" | "recovery",
        });
        if (cancelled) return;
        if (error) {
          setErrorMessage(error.message);
          setStatus("error");
          return;
        }
        setStatus("ok");
        router.replace(next);
        return;
      }

      if (typeof window !== "undefined" && window.location.hash) {
        await supabase.auth.getSession();
        if (cancelled) return;
        setStatus("ok");
        router.replace(next);
        return;
      }

      setStatus("error");
      setErrorMessage("トークンがありません。招待リンクから再度アクセスしてください。");
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [searchParams, router]);

  if (status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-6">
            <p className="text-destructive text-sm">{errorMessage}</p>
            <a href="/register" className="text-primary mt-2 inline-block text-sm underline">
              登録ページへ
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

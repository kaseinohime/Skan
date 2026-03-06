"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

type Props = {
  userId: string;
  orgName: string | null;
};

/**
 * 組織がない状態でダッシュボードに来たユーザーの組織を自動作成する。
 * サインアップ時に組織作成が失敗した場合のフォールバック。
 */
export function OrgSetupTrigger({ userId, orgName }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orgName) return;

    fetch("/api/auth/setup-organization", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, org_name: orgName }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          router.refresh();
        } else {
          setError(data.error ?? "組織の作成に失敗しました");
        }
      })
      .catch(() => setError("組織の作成に失敗しました"));
  }, [userId, orgName, router]);

  if (error) {
    return <p className="text-sm text-destructive mt-2">{error}</p>;
  }

  if (orgName) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>ワークスペースを準備しています…</span>
      </div>
    );
  }

  return null;
}

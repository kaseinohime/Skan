"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, X, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Invitation = {
  id: string;
  organization_id: string;
  role: string;
  organizations: { name: string } | null;
};

export function InvitationBanner({ invitations }: { invitations: Invitation[] }) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [accepting, setAccepting] = useState<string | null>(null);

  const visible = invitations.filter((inv) => !dismissed.has(inv.id));
  if (visible.length === 0) return null;

  const roleLabel = (role: string) =>
    role === "agency_admin" ? "企業管理者" : "スタッフ";

  const accept = async (inv: Invitation) => {
    setAccepting(inv.id);
    try {
      const res = await fetch("/api/invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitation_id: inv.id }),
      });
      if (res.ok) {
        setDismissed((prev) => new Set([...prev, inv.id]));
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "参加に失敗しました");
      }
    } finally {
      setAccepting(null);
    }
  };

  const dismiss = (id: string) => setDismissed((prev) => new Set([...prev, id]));

  return (
    <div className="space-y-2 mb-6">
      {visible.map((inv) => (
        <div
          key={inv.id}
          className="flex items-center gap-4 rounded-2xl border border-violet-200 bg-violet-50 px-5 py-4 shadow-sm"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100">
            <Users className="h-4 w-4 text-violet-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {inv.organizations?.name ?? "組織"} から招待が届いています
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {roleLabel(inv.role)} として招待されました
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              className="rounded-xl gap-1.5 bg-violet-600 hover:bg-violet-700 text-white"
              onClick={() => accept(inv)}
              disabled={accepting === inv.id}
            >
              {accepting === inv.id
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Check className="h-3.5 w-3.5" />}
              参加する
            </Button>
            <button
              onClick={() => dismiss(inv.id)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="閉じる"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

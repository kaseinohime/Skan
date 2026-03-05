"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

type OrgInfo = {
  id: string;
  name: string;
  subscription_plan: string | null;
  role: string;
};

type UserRow = {
  id: string;
  email: string;
  full_name: string;
  system_role: string;
  is_active: boolean;
  created_at: string;
  organizations: OrgInfo[];
};

const PLAN_COLORS: Record<string, string> = {
  free: "bg-slate-100 text-slate-600",
  starter: "bg-blue-100 text-blue-700",
  standard: "bg-violet-100 text-violet-700",
  pro: "bg-amber-100 text-amber-700",
  enterprise: "bg-emerald-100 text-emerald-700",
  custom: "bg-pink-100 text-pink-700",
};
const PLAN_LABELS: Record<string, string> = {
  free: "Free", starter: "Starter", standard: "Standard",
  pro: "Pro", enterprise: "Enterprise", custom: "カスタム",
};

export function UserRoleEditor({
  users,
  roleLabels,
}: {
  users: UserRow[];
  roleLabels: Record<string, string>;
}) {
  const router = useRouter();
  const [savingId, setSavingId] = useState<string | null>(null);
  const [localRoles, setLocalRoles] = useState<Record<string, string>>(
    () => Object.fromEntries(users.map((u) => [u.id, u.system_role]))
  );
  const [q, setQ] = useState("");

  const filtered = users.filter(
    (u) =>
      u.email.toLowerCase().includes(q.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(q.toLowerCase())
  );

  const handleRoleChange = async (userId: string, newRole: string) => {
    setSavingId(userId);
    try {
      const res = await fetch(`/api/master/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system_role: newRole }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data?.error?.message ?? "更新に失敗しました");
        return;
      }
      setLocalRoles((prev) => ({ ...prev, [userId]: newRole }));
      router.refresh();
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="名前・メールで検索"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-9 rounded-xl"
        />
      </div>

      <div className="rounded-2xl border border-border/60 bg-white/60 backdrop-blur-md shadow-sm overflow-hidden">
        {/* テーブルヘッダー */}
        <div className="grid grid-cols-[1fr_160px_180px_100px] gap-4 px-6 py-3 border-b border-border/40 bg-muted/30">
          <div className="text-xs font-semibold text-muted-foreground">ユーザー</div>
          <div className="text-xs font-semibold text-muted-foreground">所属組織</div>
          <div className="text-xs font-semibold text-muted-foreground">ロール変更</div>
          <div className="text-xs font-semibold text-muted-foreground">状態</div>
        </div>

        <div className="divide-y divide-border/40">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              {users.length === 0 ? "ユーザーがいません" : "該当するユーザーがいません"}
            </div>
          ) : (
            filtered.map((u) => {
              const currentRole = localRoles[u.id] ?? u.system_role;
              const isSaving = savingId === u.id;

              return (
                <div
                  key={u.id}
                  className={`grid grid-cols-[1fr_160px_180px_100px] gap-4 items-center px-6 py-4 hover:bg-muted/20 transition-colors ${!u.is_active ? "opacity-50" : ""}`}
                >
                  {/* ユーザー情報 */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
                      {(u.full_name ?? u.email ?? "?")[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">
                        {u.full_name || "—"}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                    </div>
                  </div>

                  {/* 所属組織・プラン */}
                  <div className="min-w-0">
                    {u.organizations.length === 0 ? (
                      <span className="text-xs text-muted-foreground">なし</span>
                    ) : (
                      <div className="space-y-1">
                        {u.organizations.slice(0, 2).map((org) => {
                          const plan = org.subscription_plan ?? "free";
                          return (
                            <div key={org.id} className="flex items-center gap-1.5">
                              <span className="text-xs text-foreground truncate max-w-[80px]">{org.name}</span>
                              <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold shrink-0 ${PLAN_COLORS[plan]}`}>
                                {PLAN_LABELS[plan] ?? plan}
                              </span>
                            </div>
                          );
                        })}
                        {u.organizations.length > 2 && (
                          <span className="text-[10px] text-muted-foreground">
                            +{u.organizations.length - 2}件
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ロール変更 */}
                  <div>
                    <Select
                      value={currentRole}
                      onValueChange={(value) => handleRoleChange(u.id, value)}
                      disabled={isSaving}
                    >
                      <SelectTrigger className="h-8 rounded-lg text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(["master", "agency_admin", "staff", "client"] as const).map((role) => (
                          <SelectItem key={role} value={role} className="text-xs">
                            {roleLabels[role]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isSaving && (
                      <p className="text-[10px] text-muted-foreground mt-1">保存中…</p>
                    )}
                  </div>

                  {/* 状態 */}
                  <div>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${u.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {u.is_active ? "有効" : "無効"}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        ロールを変更すると即時反映されます。マスターロールはシステム全体へのアクセスを許可するため慎重に設定してください。
      </p>
    </div>
  );
}

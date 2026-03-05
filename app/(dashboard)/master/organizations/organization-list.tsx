"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Building2, Search } from "lucide-react";

type Org = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  subscription_plan: string | null;
  subscription_status: string | null;
  current_period_end: string | null;
  stripe_customer_id: string | null;
};

const PLAN_LABELS: Record<string, string> = {
  free: "Free", starter: "Starter", standard: "Standard",
  pro: "Pro", enterprise: "Enterprise", custom: "カスタム",
};
const PLAN_COLORS: Record<string, string> = {
  free: "bg-slate-100 text-slate-600",
  starter: "bg-blue-100 text-blue-700",
  standard: "bg-violet-100 text-violet-700",
  pro: "bg-amber-100 text-amber-700",
  enterprise: "bg-emerald-100 text-emerald-700",
  custom: "bg-pink-100 text-pink-700",
};
const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  active: { label: "有効", color: "bg-emerald-100 text-emerald-700" },
  trialing: { label: "トライアル", color: "bg-blue-100 text-blue-700" },
  past_due: { label: "支払い遅延", color: "bg-amber-100 text-amber-700" },
  canceled: { label: "解約済", color: "bg-red-100 text-red-600" },
  incomplete: { label: "未完了", color: "bg-slate-100 text-slate-600" },
};

export function OrganizationList({ organizations }: { organizations: Org[] }) {
  const [q, setQ] = useState("");
  const [planFilter, setPlanFilter] = useState("all");

  const filtered = organizations.filter((o) => {
    const matchQ =
      o.name.toLowerCase().includes(q.toLowerCase()) ||
      o.slug.toLowerCase().includes(q.toLowerCase());
    const matchPlan = planFilter === "all" || (o.subscription_plan ?? "free") === planFilter;
    return matchQ && matchPlan;
  });

  return (
    <div className="space-y-4">
      {/* フィルター行 */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="企業名・スラッグで検索"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9 w-56 rounded-xl"
          />
        </div>
        <div className="flex gap-1.5">
          {["all", "free", "starter", "standard", "pro", "enterprise"].map((p) => (
            <button
              key={p}
              onClick={() => setPlanFilter(p)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                planFilter === p
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {p === "all" ? "すべて" : PLAN_LABELS[p]}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs text-muted-foreground">{filtered.length}件</span>
      </div>

      {/* 組織カード一覧 */}
      <div className="rounded-2xl border border-border/60 bg-white/60 backdrop-blur-md shadow-sm overflow-hidden">
        <div className="divide-y divide-border/40">
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Building2 className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {organizations.length === 0 ? "組織がまだありません" : "該当する組織がありません"}
              </p>
            </div>
          ) : (
            filtered.map((org) => {
              const plan = org.subscription_plan ?? "free";
              const status = org.subscription_status ?? "active";
              const statusCfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.active;
              const periodEnd = org.current_period_end
                ? new Date(org.current_period_end).toLocaleDateString("ja-JP", { month: "short", day: "numeric" })
                : null;

              return (
                <div
                  key={org.id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors"
                >
                  <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground truncate">{org.name}</span>
                      {!org.is_active && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-600">
                          無効
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {org.slug}
                      {periodEnd && <span className="ml-2">次回更新: {periodEnd}</span>}
                      {!org.stripe_customer_id && plan !== "free" && (
                        <span className="ml-2 text-amber-600">（Stripe未連携）</span>
                      )}
                    </div>
                  </div>

                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold shrink-0 ${PLAN_COLORS[plan]}`}>
                    {PLAN_LABELS[plan] ?? plan}
                  </span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold shrink-0 ${statusCfg.color}`}>
                    {statusCfg.label}
                  </span>

                  <div className="flex gap-2 shrink-0">
                    <Button variant="outline" size="sm" className="rounded-lg h-8 text-xs" asChild>
                      <Link href={`/master/organizations/${org.id}/dashboard`}>
                        入る
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" className="rounded-lg h-8 w-8 p-0" asChild>
                      <Link href={`/master/organizations/${org.id}`}>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

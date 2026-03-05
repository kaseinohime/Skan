import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, LayoutDashboard, ArrowRight, CreditCard, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

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
const PLAN_MRR: Record<string, number> = {
  free: 0, starter: 4980, standard: 12800, pro: 24800, enterprise: 0, custom: 0,
};
const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: "有効", color: "bg-emerald-100 text-emerald-700" },
  trialing: { label: "トライアル", color: "bg-blue-100 text-blue-700" },
  past_due: { label: "支払い遅延", color: "bg-amber-100 text-amber-700" },
  canceled: { label: "解約済", color: "bg-red-100 text-red-600" },
  incomplete: { label: "未完了", color: "bg-slate-100 text-slate-600" },
};

export default async function MasterDashboardPage() {
  const user = await requireRole(["master"]);
  if (!user) redirect("/login");

  const supabase = await createClient();
  const [
    { count: orgCount },
    { count: clientCount },
    { count: userCount },
    { data: organizations },
  ] = await Promise.all([
    supabase.from("organizations").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("clients").select("id", { count: "exact", head: true }),
    supabase.from("users").select("id", { count: "exact", head: true }),
    supabase
      .from("organizations")
      .select("id, name, slug, subscription_plan, subscription_status, is_active, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  // プラン別内訳
  const planCounts: Record<string, number> = {};
  for (const org of organizations ?? []) {
    const p = org.subscription_plan ?? "free";
    planCounts[p] = (planCounts[p] ?? 0) + 1;
  }

  // MRR概算（手動プラン変更分を含む概算）
  const estimatedMrr = (organizations ?? []).reduce((sum, org) => {
    const plan = org.subscription_plan ?? "free";
    return sum + (PLAN_MRR[plan] ?? 0);
  }, 0);

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground">マスターダッシュボード</h1>
          <p className="mt-1 text-sm text-muted-foreground">全組織の稼働状況と課金管理</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-lg" asChild>
            <Link href="/master/organizations/new">+ 組織を作成</Link>
          </Button>
          <Button variant="outline" size="sm" className="rounded-lg" asChild>
            <Link href="/master/users">ユーザー管理</Link>
          </Button>
        </div>
      </div>

      {/* KPIカード */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "有効組織数", value: `${orgCount ?? 0}社`, icon: Building2, href: "/master/organizations" },
          { label: "クライアント数", value: `${clientCount ?? 0}件`, icon: LayoutDashboard, href: null },
          { label: "総アカウント数", value: `${userCount ?? 0}名`, icon: Users, href: "/master/users" },
          { label: "MRR（概算）", value: `¥${estimatedMrr.toLocaleString()}`, icon: TrendingUp, href: null },
        ].map(({ label, value, icon: Icon, href }) => (
          <div key={label} className="rounded-2xl border border-border/60 bg-white/60 backdrop-blur-md p-5 shadow-sm">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Icon className="h-4 w-4" />
              <span className="text-xs font-medium">{label}</span>
            </div>
            <div className="text-2xl font-black text-foreground">{value}</div>
            {href && (
              <Link href={href} className="mt-2 text-xs text-primary hover:underline block">
                一覧を見る →
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* プラン別内訳 */}
      <div className="rounded-2xl border border-border/60 bg-white/60 backdrop-blur-md p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">プラン別内訳</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          {Object.entries(PLAN_LABELS).map(([plan, label]) => (
            <div key={plan} className="flex items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${PLAN_COLORS[plan]}`}>
                {label}
              </span>
              <span className="text-sm font-bold text-foreground">{planCounts[plan] ?? 0}社</span>
            </div>
          ))}
        </div>
      </div>

      {/* 組織一覧（最新20件） */}
      <div className="rounded-2xl border border-border/60 bg-white/60 backdrop-blur-md shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
          <h2 className="text-sm font-semibold text-foreground">組織一覧</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/master/organizations">すべて見る →</Link>
          </Button>
        </div>
        <div className="divide-y divide-border/40">
          {(organizations ?? []).length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              組織がまだありません
            </div>
          ) : (
            (organizations ?? []).map((org) => {
              const plan = org.subscription_plan ?? "free";
              const status = org.subscription_status ?? "active";
              const statusCfg = STATUS_LABELS[status] ?? STATUS_LABELS.active;
              return (
                <div key={org.id} className="flex items-center gap-4 px-6 py-3 hover:bg-muted/30 transition-colors">
                  <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-foreground truncate">{org.name}</div>
                    <div className="text-xs text-muted-foreground">{org.slug}</div>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${PLAN_COLORS[plan]}`}>
                    {PLAN_LABELS[plan]}
                  </span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${statusCfg.color}`}>
                    {statusCfg.label}
                  </span>
                  {!org.is_active && (
                    <Badge variant="outline" className="text-[10px]">無効</Badge>
                  )}
                  <Link
                    href={`/master/organizations/${org.id}`}
                    className="ml-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

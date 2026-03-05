import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { OrganizationEditForm } from "./organization-edit-form";
import { InviteMemberForm } from "./invite-member-form";
import { BillingSettingsForm } from "@/components/master/billing-settings-form";
import { Building2, Users, CreditCard, ExternalLink, ChevronLeft } from "lucide-react";

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
const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  active: { label: "有効", color: "text-emerald-600" },
  trialing: { label: "トライアル中", color: "text-blue-600" },
  past_due: { label: "支払い遅延", color: "text-amber-600" },
  canceled: { label: "解約済み", color: "text-red-600" },
  incomplete: { label: "未完了", color: "text-slate-500" },
};

export default async function MasterOrganizationDetailPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  await requireRole(["master"]);
  const { orgId } = await params;
  const supabase = await createClient();

  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", orgId)
    .single();

  if (orgError || !org) notFound();

  const { data: members } = await supabase
    .from("organization_members")
    .select("id, role, joined_at, user_id")
    .eq("organization_id", orgId)
    .eq("is_active", true);

  const { data: invitations } = await supabase
    .from("organization_invitations")
    .select("id, email, role, created_at")
    .eq("organization_id", orgId);

  const { count: clientCount } = await supabase
    .from("clients")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", orgId);

  const userIds = [...new Set((members ?? []).map((m) => m.user_id))];
  const { data: usersData } =
    userIds.length > 0
      ? await supabase.from("users").select("id, email, full_name").in("id", userIds)
      : { data: [] as { id: string; email: string; full_name: string }[] };
  const usersMap = new Map((usersData ?? []).map((u) => [u.id, u]));

  const plan = org.subscription_plan ?? "free";
  const status = org.subscription_status ?? "active";
  const statusCfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.active;
  const periodEnd = org.current_period_end
    ? new Date(org.current_period_end).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })
    : null;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-8">
      {/* ヘッダー */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="rounded-lg" asChild>
            <Link href="/master/organizations">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-foreground">{org.name}</h1>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${PLAN_COLORS[plan]}`}>
                {PLAN_LABELS[plan]}
              </span>
              {!org.is_active && (
                <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-600">無効</span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{org.slug}</p>
          </div>
        </div>
        <Button size="sm" className="rounded-xl shrink-0" asChild>
          <Link href={`/master/organizations/${orgId}/dashboard`}>
            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
            この組織に入る
          </Link>
        </Button>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border/60 bg-white/60 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <CreditCard className="h-4 w-4" />
            <span className="text-xs font-medium">サブスク状態</span>
          </div>
          <div className={`text-sm font-semibold ${statusCfg.color}`}>{statusCfg.label}</div>
          {periodEnd && (
            <div className="text-xs text-muted-foreground mt-0.5">次回更新: {periodEnd}</div>
          )}
          {org.stripe_customer_id ? (
            <div className="text-[10px] text-muted-foreground mt-1 font-mono truncate">{org.stripe_customer_id}</div>
          ) : (
            <div className="text-[10px] text-amber-600 mt-1">Stripe未連携</div>
          )}
        </div>
        <div className="rounded-2xl border border-border/60 bg-white/60 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Building2 className="h-4 w-4" />
            <span className="text-xs font-medium">クライアント数</span>
          </div>
          <div className="text-2xl font-black text-foreground">{clientCount ?? 0}件</div>
        </div>
        <div className="rounded-2xl border border-border/60 bg-white/60 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Users className="h-4 w-4" />
            <span className="text-xs font-medium">メンバー数</span>
          </div>
          <div className="text-2xl font-black text-foreground">{(members ?? []).length}名</div>
        </div>
      </div>

      {/* プラン手動変更 */}
      <div className="rounded-2xl border border-border/60 bg-white/60 backdrop-blur-md p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">プラン・AI制限（マスター手動設定）</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-5">
          この変更はStripeの請求に影響しません。DBのみ更新されます。
        </p>
        <BillingSettingsForm
          orgId={orgId}
          current={{
            subscription_plan: org.subscription_plan ?? "free",
            ai_window_hours: org.ai_window_hours ?? 720,
            ai_limit_per_window: org.ai_limit_per_window ?? 5,
            client_limit: org.client_limit ?? null,
          }}
        />
      </div>

      {/* 企業情報編集 */}
      <div className="rounded-2xl border border-border/60 bg-white/60 backdrop-blur-md shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border/40">
          <h2 className="text-sm font-semibold text-foreground">企業情報の編集</h2>
        </div>
        <div className="p-6">
          <OrganizationEditForm org={org} />
        </div>
      </div>

      {/* メンバー */}
      <div className="rounded-2xl border border-border/60 bg-white/60 backdrop-blur-md shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">メンバー（{(members ?? []).length}名）</h2>
        </div>
        <div className="divide-y divide-border/40">
          {(members ?? []).length === 0 ? (
            <div className="px-6 py-6 text-sm text-muted-foreground">メンバーはいません</div>
          ) : (
            (members ?? []).map((m) => {
              const u = usersMap.get(m.user_id);
              const roleLabel = m.role === "agency_admin" ? "企業管理者" : "スタッフ";
              return (
                <div key={m.id} className="flex items-center gap-3 px-6 py-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                    {(u?.full_name ?? u?.email ?? "?")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">
                      {u?.full_name ?? "—"}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{u?.email ?? "—"}</div>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{roleLabel}</span>
                </div>
              );
            })
          )}
        </div>
        {/* 招待フォーム */}
        <div className="px-6 pb-6 pt-4 border-t border-border/40">
          <InviteMemberForm orgId={orgId} />
        </div>
      </div>

      {/* 招待中 */}
      {(invitations?.length ?? 0) > 0 && (
        <div className="rounded-2xl border border-border/60 bg-white/60 backdrop-blur-md shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border/40">
            <h2 className="text-sm font-semibold text-foreground">招待中（{invitations!.length}件）</h2>
          </div>
          <div className="divide-y divide-border/40">
            {invitations!.map((inv: { id: string; email: string; role: string }) => (
              <div key={inv.id} className="flex items-center gap-3 px-6 py-3">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground shrink-0">
                  ?
                </div>
                <div className="flex-1">
                  <div className="text-sm text-foreground">{inv.email}</div>
                  <div className="text-xs text-muted-foreground">
                    {inv.role === "agency_admin" ? "企業管理者" : "スタッフ"} · 招待中
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

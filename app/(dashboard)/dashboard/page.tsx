import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/auth/sign-out-button";
import {
  Building2, ArrowRight, FileCheck, RotateCcw,
  CalendarClock, CheckCircle2, LayoutDashboard, Users, Crown,
} from "lucide-react";
import type { PostStatus } from "@/types";
import { InvitationBanner } from "@/components/dashboard/invitation-banner";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<PostStatus, string> = {
  draft: "下書き", in_progress: "作成中", pending_review: "承認待ち",
  revision: "差し戻し", approved: "承認済み", scheduled: "予約済み", published: "公開済み",
};
const STATUS_COLOR: Record<PostStatus, string> = {
  draft: "bg-slate-100 text-slate-600",
  in_progress: "bg-blue-100 text-blue-700",
  pending_review: "bg-amber-100 text-amber-700",
  revision: "bg-red-100 text-red-600",
  approved: "bg-violet-100 text-violet-700",
  scheduled: "bg-cyan-100 text-cyan-700",
  published: "bg-emerald-100 text-emerald-700",
};

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-md space-y-8 p-8">
        <h1 className="text-2xl font-bold">ダッシュボード</h1>
        <div className="rounded-2xl border p-6">
          <p className="text-muted-foreground mb-4">
            アカウント情報の取得に失敗しました。一度ログアウトして再ログインしてください。
          </p>
          <SignOutButton />
        </div>
      </div>
    );
  }

  // マスターはマスター画面へ
  if (user.system_role === "master") {
    return (
      <div className="mx-auto max-w-md space-y-6 p-8">
        <h1 className="text-2xl font-black">ダッシュボード</h1>
        <div className="rounded-2xl border border-border/60 bg-white/60 p-6">
          <p className="text-muted-foreground mb-4">マスターアカウントはマスター管理画面を使用します。</p>
          <Button asChild className="rounded-xl">
            <Link href="/master">マスター画面へ <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </div>
    );
  }

  const supabase = await createClient();

  // 自分宛の未処理招待
  const { data: pendingInvitations } = await supabase
    .from("organization_invitations")
    .select("id, organization_id, role, organizations(name)")
    .eq("email", user.email);

  type InvRow = { id: string; organization_id: string; role: string; organizations: { name: string } | null };
  const invitations: InvRow[] = (pendingInvitations ?? []).map((inv) => ({
    id: inv.id,
    organization_id: inv.organization_id,
    role: inv.role,
    organizations: inv.organizations as unknown as { name: string } | null,
  }));

  // 自分が所属する全組織（role付き）
  const { data: memberships } = await supabase
    .from("organization_members")
    .select("organization_id, role, organizations(id, name, subscription_plan)")
    .eq("user_id", user.id)
    .eq("is_active", true);

  type OrgMembership = {
    organization_id: string;
    role: string;
    org: { id: string; name: string; subscription_plan: string | null };
  };
  const orgs: OrgMembership[] = (memberships ?? []).map((m) => ({
    organization_id: m.organization_id,
    role: m.role,
    org: m.organizations as unknown as { id: string; name: string; subscription_plan: string | null },
  })).filter((m) => !!m.org);

  const orgIds = orgs.map((m) => m.organization_id);

  if (orgIds.length === 0) {
    return (
      <div className="mx-auto max-w-xl space-y-6 p-8">
        {invitations.length > 0 && <InvitationBanner invitations={invitations} />}
        <h1 className="text-2xl font-black">ダッシュボード</h1>
        <div className="rounded-2xl border border-border/60 bg-white/60 p-8 text-center">
          <Building2 className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">まだ組織が設定されていません</p>
          <p className="text-xs text-muted-foreground">招待メールから参加するか、管理者にお問い合わせください</p>
        </div>
      </div>
    );
  }

  // 各組織のクライアント一覧
  const { data: allClients } = await supabase
    .from("clients")
    .select("id, name, organization_id")
    .in("organization_id", orgIds)
    .eq("is_active", true)
    .order("name");

  const clientIds = (allClients ?? []).map((c) => c.id);

  // 今日の範囲
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  // 投稿データ（全クライアント横断）
  const [
    { data: allPosts },
    { data: todayPosts },
    { data: revisionPosts },
  ] = clientIds.length > 0
    ? await Promise.all([
        supabase
          .from("posts")
          .select("id, title, status, client_id, scheduled_at, updated_at")
          .in("client_id", clientIds),
        supabase
          .from("posts")
          .select("id, title, status, client_id, scheduled_at")
          .in("client_id", clientIds)
          .gte("scheduled_at", todayStart.toISOString())
          .lt("scheduled_at", tomorrowStart.toISOString())
          .order("scheduled_at"),
        supabase
          .from("posts")
          .select("id, title, client_id")
          .in("client_id", clientIds)
          .eq("status", "revision")
          .order("updated_at", { ascending: false })
          .limit(10),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];

  const posts = allPosts ?? [];
  const pendingPosts = posts.filter((p) => p.status === "pending_review");
  const publishedThisMonth = posts.filter((p) => {
    if (p.status !== "published") return false;
    const d = p.updated_at ? new Date(p.updated_at) : null;
    if (!d) return false;
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  // クライアントIDマップ（client_id → client name）
  const clientMap = new Map((allClients ?? []).map((c) => [c.id, c]));

  // 組織ごとのクライアント・投稿件数
  const orgStats = orgs.map((m) => {
    const orgClients = (allClients ?? []).filter((c) => c.organization_id === m.organization_id);
    const orgClientIds = orgClients.map((c) => c.id);
    const orgPosts = posts.filter((p) => orgClientIds.includes(p.client_id));
    const orgPending = orgPosts.filter((p) => p.status === "pending_review").length;
    const orgPublished = orgPosts.filter((p) => p.status === "published").length;
    return { ...m, clients: orgClients, pending: orgPending, published: orgPublished };
  });

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-8">
      {/* 招待バナー */}
      {invitations.length > 0 && <InvitationBanner invitations={invitations} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground">ダッシュボード</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {user.full_name} さん、今日もお疲れさまです
          </p>
        </div>
      </div>

      {/* ━━━ 今日のタスク ━━━ */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          今日のタスク
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {/* 承認待ち */}
          <Link href="/approval" className="group">
            <div className={`relative overflow-hidden rounded-2xl p-5 border transition-shadow hover:shadow-md ${pendingPosts.length > 0 ? "border-amber-200 bg-gradient-to-br from-amber-400 to-orange-500" : "border-border/60 bg-white/60"}`}>
              <div className="flex items-center gap-2 mb-3">
                <FileCheck className={`h-4 w-4 ${pendingPosts.length > 0 ? "text-white/80" : "text-muted-foreground"}`} />
                <span className={`text-xs font-semibold ${pendingPosts.length > 0 ? "text-white/80" : "text-muted-foreground"}`}>
                  承認待ち
                </span>
              </div>
              <p className={`text-4xl font-black ${pendingPosts.length > 0 ? "text-white" : "text-foreground"}`}>
                {pendingPosts.length}
              </p>
              <p className={`text-xs mt-1 ${pendingPosts.length > 0 ? "text-white/60" : "text-muted-foreground"}`}>
                件 → 確認する
              </p>
            </div>
          </Link>

          {/* 今日の公開予定 */}
          <div className={`rounded-2xl p-5 border ${(todayPosts?.length ?? 0) > 0 ? "border-violet-200 bg-gradient-to-br from-violet-400 to-indigo-500" : "border-border/60 bg-white/60"}`}>
            <div className="flex items-center gap-2 mb-3">
              <CalendarClock className={`h-4 w-4 ${(todayPosts?.length ?? 0) > 0 ? "text-white/80" : "text-muted-foreground"}`} />
              <span className={`text-xs font-semibold ${(todayPosts?.length ?? 0) > 0 ? "text-white/80" : "text-muted-foreground"}`}>
                今日の公開予定
              </span>
            </div>
            <p className={`text-4xl font-black ${(todayPosts?.length ?? 0) > 0 ? "text-white" : "text-foreground"}`}>
              {todayPosts?.length ?? 0}
            </p>
            <div className={`mt-2 space-y-1 ${(todayPosts?.length ?? 0) > 0 ? "" : "hidden"}`}>
              {(todayPosts ?? []).slice(0, 2).map((p) => (
                <Link key={p.id} href={`/clients/${p.client_id}/posts/${p.id}`} className="block text-[11px] text-white/80 hover:text-white truncate">
                  {new Date(p.scheduled_at!).toLocaleTimeString("ja", { hour: "2-digit", minute: "2-digit" })} {p.title}
                </Link>
              ))}
            </div>
            {(todayPosts?.length ?? 0) === 0 && (
              <p className="text-xs text-muted-foreground mt-1">予定なし</p>
            )}
          </div>

          {/* 差し戻し中 */}
          <div className={`rounded-2xl p-5 border ${(revisionPosts?.length ?? 0) > 0 ? "border-red-200 bg-gradient-to-br from-red-400 to-rose-500" : "border-border/60 bg-white/60"}`}>
            <div className="flex items-center gap-2 mb-3">
              <RotateCcw className={`h-4 w-4 ${(revisionPosts?.length ?? 0) > 0 ? "text-white/80" : "text-muted-foreground"}`} />
              <span className={`text-xs font-semibold ${(revisionPosts?.length ?? 0) > 0 ? "text-white/80" : "text-muted-foreground"}`}>
                差し戻し中
              </span>
            </div>
            <p className={`text-4xl font-black ${(revisionPosts?.length ?? 0) > 0 ? "text-white" : "text-foreground"}`}>
              {revisionPosts?.length ?? 0}
            </p>
            <div className="mt-2 space-y-1">
              {(revisionPosts ?? []).slice(0, 2).map((p) => (
                <Link key={p.id} href={`/clients/${p.client_id}/posts/${p.id}`} className={`block text-[11px] truncate ${(revisionPosts?.length ?? 0) > 0 ? "text-white/80 hover:text-white" : "text-muted-foreground"}`}>
                  {p.title}
                </Link>
              ))}
            </div>
            {(revisionPosts?.length ?? 0) === 0 && (
              <p className="text-xs text-muted-foreground mt-1">件</p>
            )}
          </div>
        </div>
      </section>

      {/* ━━━ 今月の成績 ━━━ */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          今月の成績（全組織合計）
        </h2>
        <div className="grid gap-4 sm:grid-cols-4">
          {[
            { label: "クライアント数", value: (allClients ?? []).length, icon: Building2, unit: "件" },
            { label: "投稿完了（今月）", value: publishedThisMonth.length, icon: CheckCircle2, unit: "件" },
            { label: "承認待ち", value: pendingPosts.length, icon: FileCheck, unit: "件" },
            { label: "差し戻し中", value: (revisionPosts ?? []).length, icon: RotateCcw, unit: "件" },
          ].map(({ label, value, icon: Icon, unit }) => (
            <div key={label} className="rounded-2xl border border-border/60 bg-white/60 backdrop-blur-md p-5 shadow-sm">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Icon className="h-4 w-4" />
                <span className="text-xs font-medium">{label}</span>
              </div>
              <div className="text-2xl font-black text-foreground">{value}<span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span></div>
            </div>
          ))}
        </div>
      </section>

      {/* ━━━ 所属組織別 ━━━ */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          所属組織（{orgs.length}）
        </h2>
        <div className="space-y-4">
          {orgStats.map((m) => (
            <div key={m.organization_id} className="rounded-2xl border border-border/60 bg-white/60 backdrop-blur-md shadow-sm overflow-hidden">
              {/* 組織ヘッダー */}
              <div className="flex items-center gap-3 px-6 py-4 border-b border-border/40 bg-muted/20">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{m.org.name}</span>
                    {m.role === "agency_admin" ? (
                      <span className="flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
                        <Crown className="h-2.5 w-2.5" />オーナー
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                        <Users className="h-2.5 w-2.5" />スタッフ
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    クライアント {m.clients.length}件 ·
                    承認待ち {m.pending}件 ·
                    公開済み（全期間）{m.published}件
                  </div>
                </div>
                {m.role === "agency_admin" && (
                  <Button variant="ghost" size="sm" className="rounded-lg text-xs shrink-0" asChild>
                    <Link href="/settings/organization">設定</Link>
                  </Button>
                )}
              </div>

              {/* クライアント一覧 */}
              {m.clients.length === 0 ? (
                <div className="px-6 py-6 text-center text-sm text-muted-foreground">
                  クライアントがまだありません
                  {m.role === "agency_admin" && (
                    <Link href="/clients/new" className="ml-2 text-primary hover:underline">
                      作成する →
                    </Link>
                  )}
                </div>
              ) : (
                <div className="grid gap-0 divide-y divide-border/40">
                  {m.clients.slice(0, 5).map((client) => {
                    const clientPosts = posts.filter((p) => p.client_id === client.id);
                    const statusCounts = clientPosts.reduce<Record<string, number>>((acc, p) => {
                      acc[p.status] = (acc[p.status] ?? 0) + 1;
                      return acc;
                    }, {});

                    return (
                      <div key={client.id} className="flex items-center gap-4 px-6 py-3 hover:bg-muted/20 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground truncate">{client.name}</div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {Object.entries(statusCounts).map(([status, count]) => (
                              <span key={status} className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLOR[status as PostStatus] ?? "bg-slate-100 text-slate-600"}`}>
                                {STATUS_LABEL[status as PostStatus] ?? status} {count}
                              </span>
                            ))}
                            {clientPosts.length === 0 && (
                              <span className="text-[10px] text-muted-foreground">投稿なし</span>
                            )}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="rounded-lg h-8 shrink-0" asChild>
                          <Link href={`/clients/${client.id}`}>
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    );
                  })}
                  {m.clients.length > 5 && (
                    <div className="px-6 py-3 text-center">
                      <Link href="/clients" className="text-xs text-primary hover:underline">
                        他 {m.clients.length - 5}件のクライアントを見る →
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* 追加ボタン（オーナーのみ） */}
              {m.role === "agency_admin" && m.clients.length === 0 && (
                <div className="px-6 pb-4">
                  <Button size="sm" className="rounded-xl" asChild>
                    <Link href="/clients/new">
                      + 最初のクライアントを作成
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 今日の公開予定（詳細） */}
      {(todayPosts ?? []).length > 0 && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            今日の公開予定（詳細）
          </h2>
          <div className="rounded-2xl border border-border/60 bg-white/60 backdrop-blur-md shadow-sm overflow-hidden divide-y divide-border/40">
            {(todayPosts ?? []).map((p) => {
              const client = clientMap.get(p.client_id);
              return (
                <div key={p.id} className="flex items-center gap-4 px-6 py-3 hover:bg-muted/20 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{p.title}</div>
                    <div className="text-xs text-muted-foreground">{client?.name ?? "—"}</div>
                  </div>
                  <div className="text-sm font-semibold text-violet-600 shrink-0">
                    {new Date(p.scheduled_at!).toLocaleTimeString("ja", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                  <Button variant="ghost" size="sm" className="rounded-lg h-8 shrink-0" asChild>
                    <Link href={`/clients/${p.client_id}/posts/${p.id}`}>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

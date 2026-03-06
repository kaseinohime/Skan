import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  FileCheck,
  FileText,
  Calendar,
  Users,
  ArrowRight,
  FolderKanban,
  BarChart2,
  FileDown,
  AlertCircle,
  Clock,
  XCircle,
  Plus,
} from "lucide-react";
import { GuestLinksSection } from "@/components/guest-links/guest-links-section";
import { PLAN_LIMITS, type Plan } from "@/lib/plans";
import type { PostStatus } from "@/types";

export const dynamic = "force-dynamic";

const statusLabel: Record<PostStatus, string> = {
  draft: "下書き",
  in_progress: "作成中",
  pending_review: "承認待ち",
  revision: "差し戻し",
  approved: "承認済み",
  scheduled: "予約済み",
  published: "公開済み",
};

const statusBadgeColor: Record<PostStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  in_progress: "bg-blue-100 text-blue-700",
  pending_review: "bg-amber-100 text-amber-700",
  revision: "bg-red-100 text-red-700",
  approved: "bg-green-100 text-green-700",
  scheduled: "bg-indigo-100 text-indigo-700",
  published: "bg-emerald-100 text-emerald-700",
};

const statusBarColor: Record<PostStatus, string> = {
  published: "bg-emerald-500",
  approved: "bg-green-400",
  scheduled: "bg-indigo-400",
  pending_review: "bg-amber-400",
  revision: "bg-red-400",
  in_progress: "bg-blue-400",
  draft: "bg-gray-300",
};

const STATUS_ORDER: PostStatus[] = [
  "published",
  "approved",
  "scheduled",
  "pending_review",
  "revision",
  "in_progress",
  "draft",
];

export default async function ClientWorkspacePage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;

  const { clientId } = await params;
  const supabase = await createClient();

  const { data: client, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .single();

  if (error || !client) notFound();

  // プラン制限チェック
  const { data: orgData } = await supabase
    .from("organizations")
    .select("subscription_plan")
    .eq("id", client.organization_id)
    .single();
  const plan = ((orgData?.subscription_plan ?? "free") as Plan);
  const planLimits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
  const guestLinksEnabled = planLimits.guestLinks;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [
    { data: allPosts },
    { data: campaigns },
    { data: recentPosts },
    { data: todayPosts },
    { data: pendingPosts },
    { data: revisionPosts },
    { count: publishedMonthCount },
    { data: publishedForInsights },
    { data: campaignPosts },
  ] = await Promise.all([
    supabase.from("posts").select("id, title, status").eq("client_id", clientId),
    supabase.from("campaigns").select("id, name").eq("client_id", clientId).order("name"),
    supabase
      .from("posts")
      .select("id, title, status, scheduled_at, post_type, platform")
      .eq("client_id", clientId)
      .order("updated_at", { ascending: false })
      .limit(5),
    supabase
      .from("posts")
      .select("id, title, scheduled_at, platform")
      .eq("client_id", clientId)
      .in("status", ["scheduled", "approved"])
      .gte("scheduled_at", todayStart)
      .lt("scheduled_at", todayEnd)
      .order("scheduled_at"),
    supabase
      .from("posts")
      .select("id, title, updated_at")
      .eq("client_id", clientId)
      .eq("status", "pending_review")
      .order("updated_at", { ascending: false })
      .limit(5),
    supabase
      .from("posts")
      .select("id, title, updated_at")
      .eq("client_id", clientId)
      .eq("status", "revision")
      .order("updated_at", { ascending: false })
      .limit(5),
    supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("client_id", clientId)
      .eq("status", "published")
      .gte("scheduled_at", monthStart),
    supabase
      .from("posts")
      .select("id, title")
      .eq("client_id", clientId)
      .eq("status", "published")
      .order("scheduled_at", { ascending: false })
      .limit(20),
    supabase
      .from("posts")
      .select("id, campaign_id, status")
      .eq("client_id", clientId)
      .not("campaign_id", "is", null),
  ]);

  // ステータス別集計
  const statusCounts = (allPosts ?? []).reduce<Record<string, number>>((acc, p) => {
    acc[p.status] = (acc[p.status] ?? 0) + 1;
    return acc;
  }, {});

  const totalPosts = allPosts?.length ?? 0;
  const publishedTotal = statusCounts["published"] ?? 0;
  const revisionTotal = statusCounts["revision"] ?? 0;

  // 承認通過率（公開済み / (公開済み + 差し戻し)）
  const approvalRate =
    publishedTotal + revisionTotal > 0
      ? Math.round((publishedTotal / (publishedTotal + revisionTotal)) * 100)
      : null;

  // キャンペーン別集計
  const campaignMap = new Map<
    string,
    { pending: number; revision: number; published: number; total: number }
  >();
  for (const cp of campaignPosts ?? []) {
    if (!cp.campaign_id) continue;
    const entry = campaignMap.get(cp.campaign_id) ?? {
      pending: 0,
      revision: 0,
      published: 0,
      total: 0,
    };
    entry.total++;
    if (cp.status === "pending_review") entry.pending++;
    if (cp.status === "revision") entry.revision++;
    if (cp.status === "published") entry.published++;
    campaignMap.set(cp.campaign_id, entry);
  }

  // インサイト未入力チェック
  let noInsightsPosts: { id: string; title: string }[] = [];
  if (publishedForInsights && publishedForInsights.length > 0) {
    const pubIds = publishedForInsights.map((p) => p.id);
    const { data: existingInsights } = await supabase
      .from("post_insights")
      .select("post_id")
      .in("post_id", pubIds);
    const insightedIds = new Set((existingInsights ?? []).map((i) => i.post_id));
    noInsightsPosts = publishedForInsights.filter((p) => !insightedIds.has(p.id)).slice(0, 5);
  }

  const canEdit = user.system_role === "agency_admin" || user.system_role === "master";

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      {/* ヘッダー */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground">{client.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {client.slug}
            {client.instagram_username && (
              <>
                {" • "}
                <a
                  href={`https://www.instagram.com/${client.instagram_username.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  @{client.instagram_username.replace(/^@/, "")}
                </a>
              </>
            )}
            {client.tiktok_username && (
              <>
                {" • "}
                <a
                  href={`https://www.tiktok.com/@${client.tiktok_username.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  @{client.tiktok_username.replace(/^@/, "")}
                </a>
              </>
            )}
          </p>
          {client.description && (
            <p className="mt-1 text-sm text-muted-foreground">{client.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-4">
          <Button asChild size="sm" className="rounded-xl gap-1">
            <Link href={`/clients/${clientId}/posts/new`}>
              <Plus className="h-4 w-4" />
              新規投稿
            </Link>
          </Button>
          {canEdit && (
            <Button variant="outline" size="sm" className="rounded-xl" asChild>
              <Link href={`/clients/${clientId}/edit`}>編集</Link>
            </Button>
          )}
        </div>
      </div>

      {/* クイックナビ */}
      <div className="flex flex-wrap gap-2">
        {[
          { href: `/clients/${clientId}/campaigns`, icon: <FolderKanban className="h-3.5 w-3.5" />, label: "企画" },
          { href: `/clients/${clientId}/posts`, icon: <FileText className="h-3.5 w-3.5" />, label: "投稿一覧" },
          { href: `/clients/${clientId}/calendar`, icon: <Calendar className="h-3.5 w-3.5" />, label: "カレンダー" },
          { href: `/clients/${clientId}/insights`, icon: <BarChart2 className="h-3.5 w-3.5" />, label: "インサイト" },
          { href: `/clients/${clientId}/team`, icon: <Users className="h-3.5 w-3.5" />, label: "チーム" },
          { href: `/clients/${clientId}/report`, icon: <FileDown className="h-3.5 w-3.5" />, label: "月次レポート" },
        ].map((item) => (
          <Button
            key={item.href}
            asChild
            variant="outline"
            size="sm"
            className="rounded-xl gap-1.5 border-border/60 bg-white/60 backdrop-blur-sm hover:bg-white/80"
          >
            <Link href={item.href}>
              {item.icon}
              {item.label}
            </Link>
          </Button>
        ))}
      </div>

      {/* 今日のタスク */}
      <div>
        <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
          今日のタスク
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Link href={`/clients/${clientId}/posts?status=pending_review`} className="block">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 p-4 text-white shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-white/80">承認待ち</p>
                  <p className="mt-1.5 text-3xl font-black">{pendingPosts?.length ?? 0}</p>
                  <p className="text-xs text-white/70">件の投稿</p>
                </div>
                <FileCheck className="h-8 w-8 text-white/30" />
              </div>
              {(pendingPosts?.length ?? 0) > 0 && (
                <p className="mt-3 truncate text-xs text-white/80">→ {pendingPosts![0].title}</p>
              )}
            </div>
          </Link>

          <Link href={`/clients/${clientId}/calendar`} className="block">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-4 text-white shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-white/80">今日の公開予定</p>
                  <p className="mt-1.5 text-3xl font-black">{todayPosts?.length ?? 0}</p>
                  <p className="text-xs text-white/70">件の投稿</p>
                </div>
                <Clock className="h-8 w-8 text-white/30" />
              </div>
              {(todayPosts?.length ?? 0) > 0 && (
                <p className="mt-3 truncate text-xs text-white/80">→ {todayPosts![0].title}</p>
              )}
            </div>
          </Link>

          <Link href={`/clients/${clientId}/posts?status=revision`} className="block">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-400 to-rose-500 p-4 text-white shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-white/80">差し戻し</p>
                  <p className="mt-1.5 text-3xl font-black">{revisionPosts?.length ?? 0}</p>
                  <p className="text-xs text-white/70">件の投稿</p>
                </div>
                <XCircle className="h-8 w-8 text-white/30" />
              </div>
              {(revisionPosts?.length ?? 0) > 0 && (
                <p className="mt-3 truncate text-xs text-white/80">→ {revisionPosts![0].title}</p>
              )}
            </div>
          </Link>
        </div>
      </div>

      {/* 投稿成績 */}
      <div>
        <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
          投稿成績
        </h2>
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-border/60 bg-white/60 p-4 shadow-sm backdrop-blur-md">
            <p className="text-xs font-medium text-muted-foreground">総投稿数</p>
            <p className="mt-1 text-2xl font-black text-foreground">{totalPosts}</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-white/60 p-4 shadow-sm backdrop-blur-md">
            <p className="text-xs font-medium text-muted-foreground">公開済み</p>
            <p className="mt-1 text-2xl font-black text-emerald-600">{publishedTotal}</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-white/60 p-4 shadow-sm backdrop-blur-md">
            <p className="text-xs font-medium text-muted-foreground">今月公開</p>
            <p className="mt-1 text-2xl font-black text-primary">{publishedMonthCount ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-white/60 p-4 shadow-sm backdrop-blur-md">
            <p className="text-xs font-medium text-muted-foreground">承認通過率</p>
            <p className="mt-1 text-2xl font-black text-foreground">
              {approvalRate !== null ? `${approvalRate}%` : "—"}
            </p>
          </div>
        </div>

        {/* ステータス別内訳バー */}
        {totalPosts > 0 && (
          <div className="mt-3 rounded-2xl border border-border/60 bg-white/60 p-4 shadow-sm backdrop-blur-md">
            <p className="mb-3 text-xs font-semibold text-muted-foreground">ステータス別内訳</p>
            <div className="flex h-2.5 overflow-hidden rounded-full">
              {STATUS_ORDER.map((s) => {
                const count = statusCounts[s] ?? 0;
                const pct = (count / totalPosts) * 100;
                if (pct === 0) return null;
                return (
                  <div
                    key={s}
                    style={{ width: `${pct}%` }}
                    className={`${statusBarColor[s]} transition-all`}
                    title={`${statusLabel[s]}: ${count}件`}
                  />
                );
              })}
            </div>
            <div className="mt-3 flex flex-wrap gap-3">
              {STATUS_ORDER.map((s) => {
                const count = statusCounts[s] ?? 0;
                if (count === 0) return null;
                return (
                  <div key={s} className="flex items-center gap-1.5">
                    <div className={`h-2 w-2 rounded-full ${statusBarColor[s]}`} />
                    <span className="text-xs text-muted-foreground">{statusLabel[s]}</span>
                    <span className="text-xs font-semibold text-foreground">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* インサイト未入力警告 */}
      {noInsightsPosts.length > 0 && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50/80 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-semibold text-amber-800">
                インサイト未入力の公開済み投稿（{noInsightsPosts.length}件）
              </p>
              <p className="mt-0.5 text-xs text-amber-700">
                公開済みなのにインサイト数値が入力されていない投稿があります。
              </p>
              <ul className="mt-2 space-y-1">
                {noInsightsPosts.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/clients/${clientId}/posts/${p.id}/insights`}
                      className="text-xs text-amber-800 hover:underline"
                    >
                      → {p.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* キャンペーン別進捗 */}
      {campaigns && campaigns.length > 0 && campaignMap.size > 0 && (
        <div>
          <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
            キャンペーン別進捗
          </h2>
          <div className="space-y-2">
            {campaigns
              .filter((c) => campaignMap.has(c.id))
              .map((campaign) => {
                const stats = campaignMap.get(campaign.id)!;
                const publishedPct =
                  stats.total > 0 ? (stats.published / stats.total) * 100 : 0;
                return (
                  <Link
                    key={campaign.id}
                    href={`/clients/${clientId}/campaigns/${campaign.id}`}
                    className="block"
                  >
                    <div className="rounded-2xl border border-border/60 bg-white/60 p-4 shadow-sm backdrop-blur-md transition-all duration-150 hover:bg-white/80 hover:shadow-md">
                      <div className="flex items-center justify-between">
                        <span className="truncate text-sm font-semibold text-foreground">
                          {campaign.name}
                        </span>
                        <div className="ml-2 flex shrink-0 items-center gap-2">
                          {stats.pending > 0 && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                              承認待ち {stats.pending}
                            </span>
                          )}
                          {stats.revision > 0 && (
                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                              差し戻し {stats.revision}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {stats.published}/{stats.total}
                          </span>
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                        </div>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted/40">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all"
                          style={{ width: `${publishedPct}%` }}
                        />
                      </div>
                    </div>
                  </Link>
                );
              })}
          </div>
        </div>
      )}

      {/* 直近の投稿 */}
      {(recentPosts?.length ?? 0) > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
              直近の投稿
            </h2>
            <Link
              href={`/clients/${clientId}/posts`}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              すべて見る <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-border/40 overflow-hidden rounded-2xl border border-border/60 bg-white/60 shadow-sm backdrop-blur-md">
            {recentPosts!.map((p) => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/clients/${clientId}/posts/${p.id}`}
                    className="block truncate text-sm font-medium text-foreground hover:underline"
                  >
                    {p.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {p.platform} / {p.post_type}
                    {p.scheduled_at &&
                      ` • ${new Date(p.scheduled_at).toLocaleDateString("ja")}`}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                    statusBadgeColor[p.status as PostStatus] ?? "bg-gray-100 text-gray-700"
                  }`}
                >
                  {statusLabel[p.status as PostStatus] ?? p.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <GuestLinksSection
        clientId={clientId}
        campaigns={campaigns ?? []}
        posts={(allPosts ?? []).map((p) => ({ id: p.id, title: p.title }))}
        guestLinksEnabled={guestLinksEnabled}
        currentPlan={plan}
      />
    </div>
  );
}

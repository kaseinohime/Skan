import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ClipboardList } from "lucide-react";
import { LogFilters } from "./log-filters";

export const dynamic = "force-dynamic";

const ENTITY_TYPE_LABELS: Record<string, string> = {
  user: "ユーザー",
  organization: "組織",
  client: "クライアント",
  client_member: "クライアントメンバー",
  org_member: "組織メンバー",
  post: "投稿",
  campaign: "キャンペーン",
  account_settings: "アカウント設定",
  guest_link: "ゲストリンク",
  billing: "プラン・課金",
  ai: "AI機能",
};

const PAGE_SIZE = 50;

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{
    org_id?: string;
    client_id?: string;
    actor_email?: string;
    entity_type?: string;
    page?: string;
  }>;
}) {
  const user = await requireRole(["master"]);
  if (!user) redirect("/login");

  const sp = await searchParams;
  const orgId = sp.org_id ?? "";
  const clientId = sp.client_id ?? "";
  const actorEmail = sp.actor_email ?? "";
  const entityType = sp.entity_type ?? "";
  const page = Math.max(1, Number(sp.page ?? 1));
  const offset = (page - 1) * PAGE_SIZE;

  const supabase = await createClient();

  // フィルター用リスト取得
  const [{ data: organizations }, { data: clients }] = await Promise.all([
    supabase.from("organizations").select("id, name").order("name"),
    supabase.from("clients").select("id, name, organization_id").order("name"),
  ]);

  // actor_email でフィルターする場合は actor_id を先に解決する
  let actorId: string | null = null;
  if (actorEmail) {
    const { data: actorUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", actorEmail)
      .maybeSingle();
    actorId = actorUser?.id ?? null;
  }

  // 監査ログ取得
  let q = supabase
    .from("audit_logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (orgId) q = q.eq("organization_id", orgId);
  if (clientId) q = q.eq("client_id", clientId);
  if (actorEmail && actorId) q = q.eq("actor_id", actorId);
  if (actorEmail && !actorId) {
    // メール一致するユーザーがいない → 0件
    return renderPage({
      logs: [], count: 0, page, orgId, clientId, actorEmail, entityType,
      organizations: organizations ?? [], clients: clients ?? [],
    });
  }
  if (entityType) q = q.eq("entity_type", entityType);

  const { data: logs, count } = await q;

  return renderPage({
    logs: logs ?? [], count: count ?? 0, page,
    orgId, clientId, actorEmail, entityType,
    organizations: organizations ?? [], clients: clients ?? [],
  });
}

type Log = Record<string, unknown>;

function renderPage({
  logs, count, page, orgId, clientId, actorEmail, entityType, organizations, clients,
}: {
  logs: Log[];
  count: number;
  page: number;
  orgId: string;
  clientId: string;
  actorEmail: string;
  entityType: string;
  organizations: { id: string; name: string }[];
  clients: { id: string; name: string; organization_id: string }[];
}) {
  const totalPages = Math.ceil(count / PAGE_SIZE);
  const offset = (page - 1) * PAGE_SIZE;

  function buildUrl(overrides: Record<string, string>) {
    const params = new URLSearchParams();
    if (orgId) params.set("org_id", orgId);
    if (clientId) params.set("client_id", clientId);
    if (actorEmail) params.set("actor_email", actorEmail);
    if (entityType) params.set("entity_type", entityType);
    if (page > 1) params.set("page", String(page));
    for (const [k, v] of Object.entries(overrides)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    return `/master/audit-logs?${params.toString()}`;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-8">
      {/* ヘッダー */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="rounded-lg" asChild>
          <Link href="/master">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black text-foreground">
            <ClipboardList className="h-6 w-6" />
            監査ログ
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            全操作履歴（{count.toLocaleString("ja")}件）
          </p>
        </div>
      </div>

      {/* フィルター（Client Component） */}
      <LogFilters
        organizations={organizations}
        clients={clients}
        current={{ orgId, clientId, actorEmail, entityType }}
      />

      {/* ログテーブル */}
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-white/60 shadow-sm backdrop-blur-md">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <ClipboardList className="mb-3 h-10 w-10 opacity-30" />
            <p className="text-sm">ログがありません</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 bg-muted/30">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">日時</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">操作者</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">操作</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">対象</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">組織</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">ワークスペース</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">詳細</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {logs.map((log) => (
                  <tr key={log.id as string} className="hover:bg-muted/20 transition-colors">
                    {/* 日時 */}
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      <time dateTime={log.created_at as string} title={log.created_at as string}>
                        {new Date(log.created_at as string).toLocaleString("ja-JP", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </time>
                    </td>

                    {/* 操作者 */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Link
                        href={buildUrl({ actor_email: log.actor_email as string, page: "1" })}
                        className="text-xs text-foreground hover:underline"
                      >
                        {log.actor_email as string}
                      </Link>
                    </td>

                    {/* 操作 */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs font-medium text-foreground">{log.action as string}</span>
                    </td>

                    {/* 対象 */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-muted-foreground">
                          {ENTITY_TYPE_LABELS[log.entity_type as string] ?? log.entity_type as string}
                        </span>
                        {log.entity_label && (
                          <span className="text-xs font-medium text-foreground truncate max-w-[160px]" title={log.entity_label as string}>
                            {log.entity_label as string}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 組織 */}
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {log.organization_name ? (
                        <Link
                          href={buildUrl({ org_id: log.organization_id as string, client_id: "", page: "1" })}
                          className="hover:underline"
                        >
                          {log.organization_name as string}
                        </Link>
                      ) : "—"}
                    </td>

                    {/* ワークスペース */}
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {log.client_name ? (
                        <Link
                          href={buildUrl({ client_id: log.client_id as string, page: "1" })}
                          className="hover:underline"
                        >
                          {log.client_name as string}
                        </Link>
                      ) : "—"}
                    </td>

                    {/* 詳細（metadata） */}
                    <td className="px-4 py-3 max-w-[240px]">
                      <MetadataCell metadata={log.metadata as Record<string, unknown>} />
                    </td>

                    {/* IP アドレス */}
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap font-mono">
                      {log.ip_address ? (log.ip_address as string) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ページネーション */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {offset + 1}〜{Math.min(offset + PAGE_SIZE, count)}件 / 全{count.toLocaleString("ja")}件
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Button variant="outline" size="sm" className="rounded-lg" asChild>
                <Link href={buildUrl({ page: String(page - 1) })}>← 前へ</Link>
              </Button>
            )}
            {page < totalPages && (
              <Button variant="outline" size="sm" className="rounded-lg" asChild>
                <Link href={buildUrl({ page: String(page + 1) })}>次へ →</Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** metadata を読みやすい形式で表示するコンポーネント */
function MetadataCell({ metadata }: { metadata: Record<string, unknown> }) {
  if (!metadata || Object.keys(metadata).length === 0) return <span className="text-muted-foreground text-xs">—</span>;

  const entries = Object.entries(metadata);
  return (
    <div className="flex flex-col gap-0.5">
      {entries.map(([key, value]) => {
        const label = META_LABELS[key] ?? key;
        const display = formatMetaValue(value);
        return (
          <div key={key} className="flex items-baseline gap-1 text-xs">
            <span className="text-muted-foreground shrink-0">{label}:</span>
            <span className="text-foreground truncate" title={display}>{display}</span>
          </div>
        );
      })}
    </div>
  );
}

const META_LABELS: Record<string, string> = {
  from: "変更前",
  to: "変更後",
  role: "ロール",
  comment: "コメント",
  next_step: "次ステップ",
  changed_fields: "変更項目",
  status: "ステータス",
  platform: "プラットフォーム",
  post_type: "投稿種別",
  ai_type: "AI機能",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "下書き",
  in_progress: "作成中",
  pending_review: "承認待ち",
  revision: "差し戻し",
  approved: "承認済み",
  scheduled: "予約済み",
  published: "公開済み",
};

const ROLE_LABELS: Record<string, string> = {
  master: "マスター",
  agency_admin: "企業管理者",
  staff: "スタッフ",
  client: "クライアント",
};

function formatMetaValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") {
    return STATUS_LABELS[value] ?? ROLE_LABELS[value] ?? value;
  }
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

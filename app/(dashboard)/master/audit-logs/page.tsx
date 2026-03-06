import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ClipboardList } from "lucide-react";

export const dynamic = "force-dynamic";

const ENTITY_TYPE_LABELS: Record<string, string> = {
  user: "ユーザー",
  organization: "組織",
  client: "クライアント",
  client_member: "クライアントメンバー",
  org_member: "組織メンバー",
  post: "投稿",
  billing: "プラン・課金",
};

const PAGE_SIZE = 50;

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{
    org_id?: string;
    client_id?: string;
    actor_id?: string;
    entity_type?: string;
    page?: string;
  }>;
}) {
  const user = await requireRole(["master"]);
  if (!user) redirect("/login");

  const sp = await searchParams;
  const orgId = sp.org_id ?? "";
  const clientId = sp.client_id ?? "";
  const actorId = sp.actor_id ?? "";
  const entityType = sp.entity_type ?? "";
  const page = Math.max(1, Number(sp.page ?? 1));
  const offset = (page - 1) * PAGE_SIZE;

  const supabase = await createClient();

  // フィルター用リスト取得
  const [{ data: organizations }, { data: clients }] = await Promise.all([
    supabase.from("organizations").select("id, name").order("name"),
    supabase.from("clients").select("id, name, organization_id").order("name"),
  ]);

  // 監査ログ取得
  let q = supabase
    .from("audit_logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (orgId) q = q.eq("organization_id", orgId);
  if (clientId) q = q.eq("client_id", clientId);
  if (actorId) q = q.eq("actor_id", actorId);
  if (entityType) q = q.eq("entity_type", entityType);

  const { data: logs, count } = await q;
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  // フィルターURLを組み立てるヘルパー
  function buildUrl(overrides: Record<string, string>) {
    const params = new URLSearchParams();
    if (orgId) params.set("org_id", orgId);
    if (clientId) params.set("client_id", clientId);
    if (actorId) params.set("actor_id", actorId);
    if (entityType) params.set("entity_type", entityType);
    if (page > 1) params.set("page", String(page));
    for (const [k, v] of Object.entries(overrides)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    const qs = params.toString();
    return `/master/audit-logs${qs ? `?${qs}` : ""}`;
  }

  // 選択中の組織名
  const selectedOrg = organizations?.find((o) => o.id === orgId);
  // 選択中の組織に属するクライアントのみ絞り込み
  const filteredClients = orgId
    ? (clients ?? []).filter((c) => c.organization_id === orgId)
    : (clients ?? []);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-8">
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
            全操作履歴（{count ?? 0}件）
          </p>
        </div>
      </div>

      {/* フィルターパネル */}
      <div className="flex flex-wrap gap-3 rounded-2xl border border-border/60 bg-white/60 p-4 backdrop-blur-md shadow-sm">
        {/* 組織 */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground font-medium">組織</span>
          <div className="flex gap-1 flex-wrap">
            <Link
              href={buildUrl({ org_id: "", client_id: "", page: "1" })}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                !orgId
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-white hover:bg-muted/50 text-foreground"
              }`}
            >
              すべて
            </Link>
            {(organizations ?? []).map((org) => (
              <Link
                key={org.id}
                href={buildUrl({ org_id: org.id, client_id: "", page: "1" })}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  orgId === org.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-white hover:bg-muted/50 text-foreground"
                }`}
              >
                {org.name}
              </Link>
            ))}
          </div>
        </div>

        {/* クライアント（組織選択時のみ表示） */}
        {filteredClients.length > 0 && (
          <div className="flex flex-col gap-1 w-full">
            <span className="text-xs text-muted-foreground font-medium">ワークスペース</span>
            <div className="flex gap-1 flex-wrap">
              <Link
                href={buildUrl({ client_id: "", page: "1" })}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  !clientId
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-white hover:bg-muted/50 text-foreground"
                }`}
              >
                すべて
              </Link>
              {filteredClients.map((c) => (
                <Link
                  key={c.id}
                  href={buildUrl({ client_id: c.id, page: "1" })}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                    clientId === c.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-white hover:bg-muted/50 text-foreground"
                  }`}
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* エンティティ種別 */}
        <div className="flex flex-col gap-1 w-full">
          <span className="text-xs text-muted-foreground font-medium">種別</span>
          <div className="flex gap-1 flex-wrap">
            <Link
              href={buildUrl({ entity_type: "", page: "1" })}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                !entityType
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-white hover:bg-muted/50 text-foreground"
              }`}
            >
              すべて
            </Link>
            {Object.entries(ENTITY_TYPE_LABELS).map(([type, label]) => (
              <Link
                key={type}
                href={buildUrl({ entity_type: type, page: "1" })}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  entityType === type
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-white hover:bg-muted/50 text-foreground"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* アクター（ユーザー）フィルター中の表示 */}
      {actorId && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>操作者でフィルター中</span>
          <Link
            href={buildUrl({ actor_id: "", page: "1" })}
            className="rounded-md border border-border px-2 py-0.5 text-xs hover:bg-muted/50"
          >
            解除
          </Link>
        </div>
      )}

      {/* ログテーブル */}
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-white/60 shadow-sm backdrop-blur-md">
        {(logs ?? []).length === 0 ? (
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
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {(logs ?? []).map((log) => (
                  <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      <time dateTime={log.created_at} title={log.created_at}>
                        {new Date(log.created_at).toLocaleString("ja-JP", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {log.actor_id ? (
                        <Link
                          href={buildUrl({ actor_id: log.actor_id, page: "1" })}
                          className="text-xs text-foreground hover:underline"
                        >
                          {log.actor_email}
                        </Link>
                      ) : (
                        <span className="text-xs text-muted-foreground">{log.actor_email}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-foreground">{log.action}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-muted-foreground">
                          {ENTITY_TYPE_LABELS[log.entity_type] ?? log.entity_type}
                        </span>
                        {log.entity_label && (
                          <span className="text-xs font-medium text-foreground truncate max-w-[180px]">
                            {log.entity_label}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {log.organization_name ? (
                        <Link
                          href={buildUrl({ org_id: log.organization_id, client_id: "", page: "1" })}
                          className="hover:underline"
                        >
                          {log.organization_name}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {log.client_name ? (
                        <Link
                          href={buildUrl({ client_id: log.client_id, page: "1" })}
                          className="hover:underline"
                        >
                          {log.client_name}
                        </Link>
                      ) : (
                        "—"
                      )}
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
            {offset + 1}〜{Math.min(offset + PAGE_SIZE, count ?? 0)}件 / 全{count ?? 0}件
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

"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

interface Org { id: string; name: string }
interface ClientRow { id: string; name: string; organization_id: string }

const ENTITY_TYPE_OPTIONS = [
  { value: "", label: "すべての種別" },
  { value: "user", label: "ユーザー" },
  { value: "organization", label: "組織" },
  { value: "client", label: "クライアント" },
  { value: "client_member", label: "クライアントメンバー" },
  { value: "org_member", label: "組織メンバー" },
  { value: "post", label: "投稿" },
  { value: "campaign", label: "キャンペーン" },
  { value: "account_settings", label: "アカウント設定" },
  { value: "guest_link", label: "ゲストリンク" },
  { value: "billing", label: "プラン・課金" },
  { value: "ai", label: "AI機能" },
];

interface Props {
  organizations: Org[];
  clients: ClientRow[];
  current: {
    orgId: string;
    clientId: string;
    actorEmail: string;
    entityType: string;
  };
}

export function LogFilters({ organizations, clients, current }: Props) {
  const router = useRouter();

  const push = useCallback(
    (overrides: Partial<typeof current>) => {
      const next = { ...current, ...overrides };
      const params = new URLSearchParams();
      if (next.orgId) params.set("org_id", next.orgId);
      if (next.clientId) params.set("client_id", next.clientId);
      if (next.actorEmail) params.set("actor_email", next.actorEmail);
      if (next.entityType) params.set("entity_type", next.entityType);
      params.set("page", "1");
      router.push(`/master/audit-logs?${params.toString()}`);
    },
    [current, router]
  );

  // 選択中の組織に属するクライアントのみ表示
  const filteredClients = current.orgId
    ? clients.filter((c) => c.organization_id === current.orgId)
    : clients;

  return (
    <div className="flex flex-wrap gap-3 rounded-2xl border border-border/60 bg-white/60 p-4 backdrop-blur-md shadow-sm">
      {/* 組織 */}
      <div className="flex flex-col gap-1 min-w-[200px]">
        <label className="text-xs font-medium text-muted-foreground">組織</label>
        <select
          value={current.orgId}
          onChange={(e) => push({ orgId: e.target.value, clientId: "" })}
          className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">すべての組織</option>
          {organizations.map((org) => (
            <option key={org.id} value={org.id}>{org.name}</option>
          ))}
        </select>
      </div>

      {/* ワークスペース（クライアント） */}
      <div className="flex flex-col gap-1 min-w-[200px]">
        <label className="text-xs font-medium text-muted-foreground">ワークスペース</label>
        <select
          value={current.clientId}
          onChange={(e) => push({ clientId: e.target.value })}
          className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          disabled={filteredClients.length === 0}
        >
          <option value="">すべてのワークスペース</option>
          {filteredClients.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* 操作者（メールアドレスで検索） */}
      <div className="flex flex-col gap-1 min-w-[220px]">
        <label className="text-xs font-medium text-muted-foreground">操作者（メール）</label>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const input = (e.currentTarget.elements.namedItem("actor_email") as HTMLInputElement).value.trim();
            push({ actorEmail: input });
          }}
          className="flex gap-1"
        >
          <input
            name="actor_email"
            defaultValue={current.actorEmail}
            placeholder="user@example.com"
            className="flex-1 rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            type="submit"
            className="rounded-lg border border-border bg-white px-3 py-2 text-xs font-medium text-foreground hover:bg-muted/50 transition-colors"
          >
            絞込
          </button>
          {current.actorEmail && (
            <button
              type="button"
              onClick={() => push({ actorEmail: "" })}
              className="rounded-lg border border-border bg-white px-2 py-2 text-xs text-muted-foreground hover:bg-muted/50 transition-colors"
            >
              ✕
            </button>
          )}
        </form>
      </div>

      {/* 種別 */}
      <div className="flex flex-col gap-1 min-w-[180px]">
        <label className="text-xs font-medium text-muted-foreground">種別</label>
        <select
          value={current.entityType}
          onChange={(e) => push({ entityType: e.target.value })}
          className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          {ENTITY_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* クリアボタン */}
      {(current.orgId || current.clientId || current.actorEmail || current.entityType) && (
        <div className="flex flex-col justify-end">
          <button
            onClick={() => push({ orgId: "", clientId: "", actorEmail: "", entityType: "" })}
            className="rounded-lg border border-border bg-white px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
          >
            フィルターをクリア
          </button>
        </div>
      )}
    </div>
  );
}

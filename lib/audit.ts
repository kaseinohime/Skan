import { createAdminClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface AuditLogParams {
  actorId: string;
  actorEmail: string;
  action: string;
  entityType: string;
  entityId?: string;
  entityLabel?: string;
  organizationId?: string;
  organizationName?: string;
  clientId?: string;
  clientName?: string;
  metadata?: Record<string, unknown>;
  request?: Request;
}

/** リクエストヘッダーから IP アドレスと User-Agent を抽出する */
export function extractRequestMeta(request: Request): { ipAddress?: string; userAgent?: string } {
  const ipAddress =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    undefined;
  const userAgent = request.headers.get("user-agent") ?? undefined;
  return { ipAddress, userAgent };
}

/** クライアントに紐づく組織情報をまとめて取得する（ログ記録の共通処理） */
export async function getClientAuditContext(
  supabase: SupabaseClient,
  clientId: string
): Promise<{ clientName?: string; organizationId?: string; organizationName?: string }> {
  const { data } = await supabase
    .from("clients")
    .select("name, organization_id, organizations(name)")
    .eq("id", clientId)
    .single();

  return {
    clientName: data?.name,
    organizationId: data?.organization_id,
    organizationName: (() => { const o = data?.organizations as unknown as { name: string } | { name: string }[] | null; return Array.isArray(o) ? o[0]?.name : o?.name; })(),
  };
}

/**
 * 監査ログを記録する。
 * 失敗してもメイン処理に影響しないよう例外は握り潰す。
 */
export async function logAudit(params: AuditLogParams): Promise<void> {
  try {
    const { ipAddress, userAgent } = params.request
      ? extractRequestMeta(params.request)
      : {};

    const admin = createAdminClient();
    await admin.from("audit_logs").insert({
      actor_id: params.actorId,
      actor_email: params.actorEmail,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId ?? null,
      entity_label: params.entityLabel ?? null,
      organization_id: params.organizationId ?? null,
      organization_name: params.organizationName ?? null,
      client_id: params.clientId ?? null,
      client_name: params.clientName ?? null,
      metadata: params.metadata ?? {},
      ip_address: ipAddress ?? null,
      user_agent: userAgent ?? null,
    });
  } catch {
    // 監査ログの失敗はメイン処理に影響させない
  }
}

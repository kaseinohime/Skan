import { createAdminClient } from "@/lib/supabase/admin";

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
}

/**
 * 監査ログを記録する。
 * 失敗してもメイン処理に影響しないよう例外は握り潰す。
 */
export async function logAudit(params: AuditLogParams): Promise<void> {
  try {
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
    });
  } catch {
    // 監査ログの失敗はメイン処理に影響させない
  }
}

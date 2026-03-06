-- 監査ログテーブル
-- masterのみ閲覧可。INSERTはadminクライアント（サービスロール）経由で行う
CREATE TABLE public.audit_logs (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- 操作者（削除されても email で識別できるよう非正規化）
  actor_id        UUID        REFERENCES public.users(id) ON DELETE SET NULL,
  actor_email     TEXT        NOT NULL,
  -- 操作内容
  action          TEXT        NOT NULL,
  -- 対象エンティティ
  entity_type     TEXT        NOT NULL, -- 'user' | 'organization' | 'client' | 'client_member' | 'org_member' | 'post' | 'billing'
  entity_id       TEXT,
  entity_label    TEXT,
  -- スコープ（削除後も名前で分かるよう非正規化）
  organization_id UUID        REFERENCES public.organizations(id) ON DELETE SET NULL,
  organization_name TEXT,
  client_id       UUID        REFERENCES public.clients(id) ON DELETE SET NULL,
  client_name     TEXT,
  -- 追加情報
  metadata        JSONB       NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_audit_logs_created_at        ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_actor_id          ON public.audit_logs(actor_id);
CREATE INDEX idx_audit_logs_organization_id   ON public.audit_logs(organization_id);
CREATE INDEX idx_audit_logs_client_id         ON public.audit_logs(client_id);
CREATE INDEX idx_audit_logs_entity_type       ON public.audit_logs(entity_type);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- masterのみ閲覧可
CREATE POLICY "audit_logs_select_master"
  ON public.audit_logs FOR SELECT
  USING (public.is_master());

-- INSERT はサービスロール（admin クライアント）のみ。RLS ポリシーは設定しない。

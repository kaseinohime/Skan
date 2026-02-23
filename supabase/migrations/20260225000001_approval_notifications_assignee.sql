-- クライアントに担当者を追加（主担当）
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES public.users(id);

CREATE INDEX IF NOT EXISTS idx_clients_assigned_to ON public.clients(assigned_to);

-- 組織へのアクセス権（企業管理者 or マスター）
CREATE OR REPLACE FUNCTION public.can_manage_organization(oid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT public.is_master()
  OR EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = oid AND om.user_id = auth.uid() AND om.role = 'agency_admin' AND om.is_active = true
  );
$$;
GRANT EXECUTE ON FUNCTION public.can_manage_organization(uuid) TO authenticated;

-- approval_templates（承認フローテンプレート）
CREATE TABLE public.approval_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_approval_templates_org ON public.approval_templates(organization_id);
CREATE TRIGGER set_approval_templates_updated_at
  BEFORE UPDATE ON public.approval_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.approval_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "approval_templates_select" ON public.approval_templates
  FOR SELECT USING (public.can_manage_organization(organization_id));
CREATE POLICY "approval_templates_insert" ON public.approval_templates
  FOR INSERT WITH CHECK (public.can_manage_organization(organization_id));
CREATE POLICY "approval_templates_update" ON public.approval_templates
  FOR UPDATE USING (public.can_manage_organization(organization_id)) WITH CHECK (public.can_manage_organization(organization_id));
CREATE POLICY "approval_templates_delete" ON public.approval_templates
  FOR DELETE USING (public.can_manage_organization(organization_id));

-- approval_steps（承認ステップ）
CREATE TABLE public.approval_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.approval_templates(id) ON DELETE CASCADE,
  step_order INT NOT NULL,
  name TEXT NOT NULL,
  required_role TEXT NOT NULL CHECK (required_role IN ('staff', 'agency_admin', 'client')),
  assigned_to UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_approval_steps_template ON public.approval_steps(template_id);
CREATE UNIQUE INDEX idx_approval_steps_order ON public.approval_steps(template_id, step_order);

ALTER TABLE public.approval_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "approval_steps_select" ON public.approval_steps
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.approval_templates t WHERE t.id = template_id AND public.can_manage_organization(t.organization_id))
  );
CREATE POLICY "approval_steps_insert" ON public.approval_steps
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.approval_templates t WHERE t.id = template_id AND public.can_manage_organization(t.organization_id))
  );
CREATE POLICY "approval_steps_update_delete" ON public.approval_steps
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.approval_templates t WHERE t.id = template_id AND public.can_manage_organization(t.organization_id))
  );

-- approval_logs（承認履歴）
CREATE TABLE public.approval_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  step_order INT NOT NULL,
  step_name TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('approved', 'rejected', 'skipped')),
  comment TEXT,
  acted_by UUID NOT NULL REFERENCES public.users(id),
  acted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_approval_logs_post ON public.approval_logs(post_id);

ALTER TABLE public.approval_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "approval_logs_select" ON public.approval_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND public.can_access_client(p.client_id))
  );
CREATE POLICY "approval_logs_insert" ON public.approval_logs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND public.can_access_client(p.client_id))
  );

-- notifications（通知）
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  type TEXT NOT NULL CHECK (type IN ('approval_request', 'approval_result', 'comment', 'mention', 'invitation', 'system')),
  reference_type TEXT CHECK (reference_type IN ('post', 'comment', 'client', 'organization')),
  reference_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = false;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 通知作成は RPC で行う（他ユーザーへの INSERT のため）
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id uuid,
  p_title text,
  p_body text DEFAULT NULL,
  p_type text DEFAULT 'system',
  p_reference_type text DEFAULT NULL,
  p_reference_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  nid uuid;
BEGIN
  INSERT INTO public.notifications (user_id, title, body, type, reference_type, reference_id)
  VALUES (p_user_id, p_title, p_body, p_type, p_reference_type, p_reference_id)
  RETURNING id INTO nid;
  RETURN nid;
END;
$$;
GRANT EXECUTE ON FUNCTION public.create_notification(uuid, text, text, text, text, uuid) TO authenticated;

-- クライアントの担当者候補（同一組織メンバー＋クライアントメンバー）を返す（RLS をバイパス）
CREATE OR REPLACE FUNCTION public.get_assignable_users_for_client(cid uuid)
RETURNS TABLE(id uuid, full_name text, email text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT u.id, u.full_name, u.email
  FROM public.users u
  WHERE u.is_active = true
  AND (
    EXISTS (
      SELECT 1 FROM public.clients c
      JOIN public.organization_members om ON om.organization_id = c.organization_id AND om.is_active = true
      WHERE c.id = cid AND om.user_id = u.id
    )
    OR EXISTS (
      SELECT 1 FROM public.client_members cm
      WHERE cm.client_id = cid AND cm.user_id = u.id AND cm.is_active = true
    )
  )
  ORDER BY u.full_name;
$$;
GRANT EXECUTE ON FUNCTION public.get_assignable_users_for_client(uuid) TO authenticated;

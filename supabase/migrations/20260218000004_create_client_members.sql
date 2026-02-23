-- client_members（クライアントチームメンバー）
CREATE TABLE public.client_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('staff', 'client')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(client_id, user_id)
);

CREATE INDEX idx_client_members_client ON public.client_members(client_id);
CREATE INDEX idx_client_members_user ON public.client_members(user_id);

CREATE TRIGGER set_client_members_updated_at
  BEFORE UPDATE ON public.client_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- client_invitations（ワークスペースへの招待：登録後に client_members に追加）
CREATE TABLE public.client_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('staff', 'client')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(client_id, email)
);

CREATE INDEX idx_client_invitations_client ON public.client_invitations(client_id);
CREATE INDEX idx_client_invitations_email ON public.client_invitations(email);

-- RLS: client_members
ALTER TABLE public.client_members ENABLE ROW LEVEL SECURITY;

-- マスターは全件
CREATE POLICY "client_members_master_all"
  ON public.client_members
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.system_role = 'master'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.system_role = 'master'));

-- 企業管理者は自企業のクライアントのメンバーを閲覧・追加・更新・削除
CREATE POLICY "client_members_agency_admin_select"
  ON public.client_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      JOIN public.organization_members om ON om.organization_id = c.organization_id
      WHERE c.id = client_members.client_id AND om.user_id = auth.uid() AND om.role = 'agency_admin' AND om.is_active = true
    )
  );

CREATE POLICY "client_members_agency_admin_insert"
  ON public.client_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clients c
      JOIN public.organization_members om ON om.organization_id = c.organization_id
      WHERE c.id = client_members.client_id AND om.user_id = auth.uid() AND om.role = 'agency_admin' AND om.is_active = true
    )
  );

CREATE POLICY "client_members_agency_admin_update_delete"
  ON public.client_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      JOIN public.organization_members om ON om.organization_id = c.organization_id
      WHERE c.id = client_members.client_id AND om.user_id = auth.uid() AND om.role = 'agency_admin' AND om.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clients c
      JOIN public.organization_members om ON om.organization_id = c.organization_id
      WHERE c.id = client_members.client_id AND om.user_id = auth.uid() AND om.role = 'agency_admin' AND om.is_active = true
    )
  );

CREATE POLICY "client_members_agency_admin_delete"
  ON public.client_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      JOIN public.organization_members om ON om.organization_id = c.organization_id
      WHERE c.id = client_members.client_id AND om.user_id = auth.uid() AND om.role = 'agency_admin' AND om.is_active = true
    )
  );

-- ワークスペースメンバーは自分が属する client_members を閲覧可能
CREATE POLICY "client_members_member_select"
  ON public.client_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.client_members cm
      WHERE cm.client_id = client_members.client_id AND cm.user_id = auth.uid() AND cm.is_active = true
    )
  );

-- 招待受諾時：client_invitations に自分のメールがある場合に自分を INSERT 可能
CREATE POLICY "client_members_invited_insert"
  ON public.client_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.client_invitations ci
      WHERE ci.client_id = client_members.client_id AND ci.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- RLS: client_invitations
ALTER TABLE public.client_invitations ENABLE ROW LEVEL SECURITY;

-- マスターは全件
CREATE POLICY "client_invitations_master_all"
  ON public.client_invitations
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.system_role = 'master'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.system_role = 'master'));

-- 企業管理者は自企業のクライアントへの招待を閲覧・追加・削除
CREATE POLICY "client_invitations_agency_admin_select"
  ON public.client_invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      JOIN public.organization_members om ON om.organization_id = c.organization_id
      WHERE c.id = client_invitations.client_id AND om.user_id = auth.uid() AND om.role = 'agency_admin' AND om.is_active = true
    )
  );

CREATE POLICY "client_invitations_agency_admin_insert"
  ON public.client_invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clients c
      JOIN public.organization_members om ON om.organization_id = c.organization_id
      WHERE c.id = client_invitations.client_id AND om.user_id = auth.uid() AND om.role = 'agency_admin' AND om.is_active = true
    )
  );

CREATE POLICY "client_invitations_agency_admin_delete"
  ON public.client_invitations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      JOIN public.organization_members om ON om.organization_id = c.organization_id
      WHERE c.id = client_invitations.client_id AND om.user_id = auth.uid() AND om.role = 'agency_admin' AND om.is_active = true
    )
  );

-- 招待されたユーザーが自分のメールの招待を読める（受諾処理用）
CREATE POLICY "client_invitations_invited_read"
  ON public.client_invitations FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND email = client_invitations.email)
  );

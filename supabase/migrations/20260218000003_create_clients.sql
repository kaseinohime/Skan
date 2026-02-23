-- clients（クライアント = ワークスペース）
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  sns_platforms TEXT[] DEFAULT '{}',
  instagram_username TEXT,
  tiktok_username TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, slug)
);

CREATE INDEX idx_clients_org ON public.clients(organization_id);

CREATE TRIGGER set_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- マスターは全クライアントを閲覧・作成・更新・削除可能
CREATE POLICY "clients_master_all"
  ON public.clients
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.system_role = 'master'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.system_role = 'master'
    )
  );

-- 所属企業のクライアントは閲覧可能（企業メンバー）
CREATE POLICY "clients_select_org_member"
  ON public.clients
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = clients.organization_id
        AND om.user_id = auth.uid()
        AND om.is_active = true
    )
  );

-- 企業管理者は自企業のクライアントを作成可能
CREATE POLICY "clients_insert_agency_admin"
  ON public.clients
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = clients.organization_id
        AND om.user_id = auth.uid()
        AND om.role = 'agency_admin'
        AND om.is_active = true
    )
  );

-- 企業管理者は自企業のクライアントを更新・削除可能
CREATE POLICY "clients_update_delete_agency_admin"
  ON public.clients
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = clients.organization_id
        AND om.user_id = auth.uid()
        AND om.role = 'agency_admin'
        AND om.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = clients.organization_id
        AND om.user_id = auth.uid()
        AND om.role = 'agency_admin'
        AND om.is_active = true
    )
  );

CREATE POLICY "clients_delete_agency_admin"
  ON public.clients
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = clients.organization_id
        AND om.user_id = auth.uid()
        AND om.role = 'agency_admin'
        AND om.is_active = true
    )
  );

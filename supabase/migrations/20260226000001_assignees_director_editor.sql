-- ディレクター・編集者を複数人設定する中間テーブル（クライアント・企画・投稿）

-- client_assignees（クライアントのディレクター・編集者）
CREATE TABLE public.client_assignees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('director', 'editor')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(client_id, user_id, role)
);
CREATE INDEX idx_client_assignees_client ON public.client_assignees(client_id);
CREATE INDEX idx_client_assignees_user ON public.client_assignees(user_id);

ALTER TABLE public.client_assignees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "client_assignees_all" ON public.client_assignees
  FOR ALL USING (public.can_access_client(client_id))
  WITH CHECK (public.can_access_client(client_id));

-- campaign_assignees（企画のディレクター・編集者）
CREATE TABLE public.campaign_assignees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('director', 'editor')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, user_id, role)
);
CREATE INDEX idx_campaign_assignees_campaign ON public.campaign_assignees(campaign_id);
CREATE INDEX idx_campaign_assignees_user ON public.campaign_assignees(user_id);

ALTER TABLE public.campaign_assignees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "campaign_assignees_all" ON public.campaign_assignees
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_id AND public.can_access_client(c.client_id))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_id AND public.can_access_client(c.client_id))
  );

-- post_assignees（投稿のディレクター・編集者）
CREATE TABLE public.post_assignees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('director', 'editor')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id, role)
);
CREATE INDEX idx_post_assignees_post ON public.post_assignees(post_id);
CREATE INDEX idx_post_assignees_user ON public.post_assignees(user_id);

ALTER TABLE public.post_assignees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "post_assignees_all" ON public.post_assignees
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND public.can_access_client(p.client_id))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND public.can_access_client(p.client_id))
  );

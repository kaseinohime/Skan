-- guest_links（ゲスト閲覧リンク）
CREATE TABLE public.guest_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  scope TEXT NOT NULL DEFAULT 'client' CHECK (scope IN ('client', 'campaign', 'post')),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_guest_links_token ON public.guest_links(token);
CREATE INDEX idx_guest_links_client ON public.guest_links(client_id);

ALTER TABLE public.guest_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "guest_links_select" ON public.guest_links
  FOR SELECT USING (public.can_access_client(client_id));

CREATE POLICY "guest_links_insert" ON public.guest_links
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND public.can_access_client(client_id)
  );

CREATE POLICY "guest_links_update" ON public.guest_links
  FOR UPDATE USING (public.can_access_client(client_id))
  WITH CHECK (public.can_access_client(client_id));

CREATE POLICY "guest_links_delete" ON public.guest_links
  FOR DELETE USING (public.can_access_client(client_id));

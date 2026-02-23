-- クライアントへのアクセス権判定（RLS で再利用）
CREATE OR REPLACE FUNCTION public.can_access_client(cid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT public.is_master()
  OR EXISTS (
    SELECT 1 FROM public.client_members cm
    WHERE cm.client_id = cid AND cm.user_id = auth.uid() AND cm.is_active = true
  )
  OR EXISTS (
    SELECT 1 FROM public.clients c
    JOIN public.organization_members om ON om.organization_id = c.organization_id
    WHERE c.id = cid AND om.user_id = auth.uid() AND om.role = 'agency_admin' AND om.is_active = true
  );
$$;
GRANT EXECUTE ON FUNCTION public.can_access_client(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.can_access_client(uuid) TO authenticated;

-- campaigns（企画）
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_campaigns_client ON public.campaigns(client_id);
CREATE INDEX idx_campaigns_status ON public.campaigns(status);
CREATE TRIGGER set_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "campaigns_select" ON public.campaigns FOR SELECT USING (public.can_access_client(client_id));
CREATE POLICY "campaigns_insert" ON public.campaigns FOR INSERT WITH CHECK (public.can_access_client(client_id));
CREATE POLICY "campaigns_update" ON public.campaigns FOR UPDATE USING (public.can_access_client(client_id)) WITH CHECK (public.can_access_client(client_id));
CREATE POLICY "campaigns_delete" ON public.campaigns FOR DELETE USING (public.can_access_client(client_id));

-- posts（投稿）
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  caption TEXT,
  hashtags TEXT[] DEFAULT '{}',
  post_type TEXT NOT NULL DEFAULT 'feed' CHECK (post_type IN ('feed', 'reel', 'story', 'tiktok')),
  platform TEXT NOT NULL DEFAULT 'instagram' CHECK (platform IN ('instagram', 'tiktok')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'pending_review', 'revision', 'approved', 'scheduled', 'published')),
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  media_urls TEXT[] DEFAULT '{}',
  media_type TEXT CHECK (media_type IN ('image', 'video', 'carousel')),
  assigned_to UUID REFERENCES public.users(id),
  current_approval_step INT DEFAULT 0,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_posts_client ON public.posts(client_id);
CREATE INDEX idx_posts_campaign ON public.posts(campaign_id);
CREATE INDEX idx_posts_status ON public.posts(status);
CREATE INDEX idx_posts_scheduled ON public.posts(scheduled_at);
CREATE INDEX idx_posts_assigned ON public.posts(assigned_to);
CREATE TRIGGER set_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "posts_select" ON public.posts FOR SELECT USING (public.can_access_client(client_id));
CREATE POLICY "posts_insert" ON public.posts FOR INSERT WITH CHECK (public.can_access_client(client_id));
CREATE POLICY "posts_update" ON public.posts FOR UPDATE USING (public.can_access_client(client_id)) WITH CHECK (public.can_access_client(client_id));
CREATE POLICY "posts_delete" ON public.posts FOR DELETE USING (public.can_access_client(client_id));

-- post_revisions（投稿リビジョン）
CREATE TABLE public.post_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  revision_number INT NOT NULL,
  caption TEXT,
  hashtags TEXT[] DEFAULT '{}',
  media_urls TEXT[] DEFAULT '{}',
  change_summary TEXT,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_post_revisions_post ON public.post_revisions(post_id);
CREATE UNIQUE INDEX idx_post_revisions_unique ON public.post_revisions(post_id, revision_number);

ALTER TABLE public.post_revisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "post_revisions_select" ON public.post_revisions FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_revisions.post_id AND public.can_access_client(p.client_id)));
CREATE POLICY "post_revisions_insert" ON public.post_revisions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_revisions.post_id AND public.can_access_client(p.client_id)));

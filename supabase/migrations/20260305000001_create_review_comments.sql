-- review_comments（修正指示・コメント）
CREATE TABLE public.review_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id),
  content TEXT NOT NULL,
  target_type TEXT CHECK (target_type IN ('image', 'video', 'caption', 'general')),
  target_index INT,
  target_timestamp_sec NUMERIC,
  comment_status TEXT NOT NULL DEFAULT 'open' CHECK (comment_status IN ('open', 'resolved')),
  parent_id UUID REFERENCES public.review_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_review_comments_post ON public.review_comments(post_id);
CREATE INDEX idx_review_comments_status ON public.review_comments(comment_status);
CREATE INDEX idx_review_comments_parent ON public.review_comments(parent_id);

CREATE TRIGGER set_review_comments_updated_at
  BEFORE UPDATE ON public.review_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.review_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "review_comments_select" ON public.review_comments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND public.can_access_client(p.client_id))
  );

CREATE POLICY "review_comments_insert" ON public.review_comments
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND public.can_access_client(p.client_id))
  );

CREATE POLICY "review_comments_update" ON public.review_comments
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND public.can_access_client(p.client_id))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND public.can_access_client(p.client_id))
  );

CREATE POLICY "review_comments_delete" ON public.review_comments
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND public.can_access_client(p.client_id))
  );

-- Realtime で review_comments の変更を購読できるようにする
ALTER PUBLICATION supabase_realtime ADD TABLE public.review_comments;

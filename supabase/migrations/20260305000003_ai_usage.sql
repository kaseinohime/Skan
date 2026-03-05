-- AI利用回数（レート制限用）
CREATE TABLE public.ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_type TEXT NOT NULL CHECK (usage_type IN ('caption', 'hashtag')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_usage_user_date ON public.ai_usage(user_id, usage_type, created_at);

ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

-- 自分の利用履歴のみ参照可（API経由で集計するため）
CREATE POLICY "ai_usage_select_own" ON public.ai_usage
  FOR SELECT USING (user_id = auth.uid());

-- 自分の利用のみ記録可（APIはサーバーで requireAuth 後に INSERT）
CREATE POLICY "ai_usage_insert_own" ON public.ai_usage
  FOR INSERT WITH CHECK (user_id = auth.uid());

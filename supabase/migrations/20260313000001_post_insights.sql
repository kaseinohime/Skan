-- post_insights（投稿インサイス数値）
CREATE TABLE public.post_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL UNIQUE REFERENCES public.posts(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,

  -- 基本数値（手入力）
  followers_count INTEGER,
  reach INTEGER,
  saves INTEGER,
  follower_reach INTEGER,
  non_follower_reach INTEGER,
  profile_visits INTEGER,
  follows INTEGER,
  web_taps INTEGER,
  discovery INTEGER,

  -- 分析メタ（手入力）
  target_segment TEXT,
  genre TEXT,
  theme TEXT,
  memo TEXT,

  -- 派生指標（INSERT/PATCH 時にアプリ側で計算して保存）
  save_rate NUMERIC(8, 6),
  home_rate NUMERIC(8, 6),
  profile_visit_rate NUMERIC(8, 6),
  follower_conversion_rate NUMERIC(8, 6),
  web_tap_rate NUMERIC(8, 6),

  recorded_by UUID REFERENCES public.users(id),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_post_insights_post ON public.post_insights(post_id);
CREATE INDEX idx_post_insights_client ON public.post_insights(client_id);
CREATE INDEX idx_post_insights_recorded_at ON public.post_insights(recorded_at);

CREATE TRIGGER set_post_insights_updated_at
  BEFORE UPDATE ON public.post_insights
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.post_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "insights_select" ON public.post_insights FOR SELECT
  USING (public.can_access_client(client_id));
CREATE POLICY "insights_insert" ON public.post_insights FOR INSERT
  WITH CHECK (public.can_access_client(client_id));
CREATE POLICY "insights_update" ON public.post_insights FOR UPDATE
  USING (public.can_access_client(client_id))
  WITH CHECK (public.can_access_client(client_id));
CREATE POLICY "insights_delete" ON public.post_insights FOR DELETE
  USING (public.can_access_client(client_id));

-- client_account_settings（アカウント設計情報）
CREATE TABLE public.client_account_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL UNIQUE REFERENCES public.clients(id) ON DELETE CASCADE,

  profile_text TEXT,
  caption_template TEXT,
  hashtag_sets JSONB NOT NULL DEFAULT '[]',
  persona TEXT,

  -- KPI目標値（小数: 0.02 = 2%）
  kpi_save_rate_target NUMERIC(6, 4) NOT NULL DEFAULT 0.02,
  kpi_home_rate_target NUMERIC(6, 4) NOT NULL DEFAULT 0.40,

  benchmark_accounts JSONB NOT NULL DEFAULT '[]',
  competitor_accounts JSONB NOT NULL DEFAULT '[]',
  content_ideas JSONB NOT NULL DEFAULT '[]',

  updated_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_client_account_settings_updated_at
  BEFORE UPDATE ON public.client_account_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.client_account_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "account_settings_select" ON public.client_account_settings FOR SELECT
  USING (public.can_access_client(client_id));
CREATE POLICY "account_settings_insert" ON public.client_account_settings FOR INSERT
  WITH CHECK (public.can_access_client(client_id));
CREATE POLICY "account_settings_update" ON public.client_account_settings FOR UPDATE
  USING (public.can_access_client(client_id))
  WITH CHECK (public.can_access_client(client_id));

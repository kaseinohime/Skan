-- 組織にプラン・AI制限・クライアント数上限を追加
ALTER TABLE public.organizations
  ADD COLUMN subscription_plan TEXT NOT NULL DEFAULT 'free'
    CHECK (subscription_plan IN ('free', 'starter', 'growth', 'pro', 'custom')),
  ADD COLUMN ai_window_hours INTEGER NOT NULL DEFAULT 1
    CHECK (ai_window_hours BETWEEN 1 AND 720),
  ADD COLUMN ai_limit_per_window INTEGER NOT NULL DEFAULT 10
    CHECK (ai_limit_per_window >= 0),
  ADD COLUMN client_limit INTEGER
    CHECK (client_limit IS NULL OR client_limit >= 0);

COMMENT ON COLUMN public.organizations.subscription_plan IS '課金プラン: free/starter/growth/pro/custom';
COMMENT ON COLUMN public.organizations.ai_window_hours IS 'AIレート制限のウィンドウ（時間）: 1〜720（30日）';
COMMENT ON COLUMN public.organizations.ai_limit_per_window IS 'ウィンドウ内のAI利用回数上限';
COMMENT ON COLUMN public.organizations.client_limit IS 'クライアント数上限（NULL=無制限）';

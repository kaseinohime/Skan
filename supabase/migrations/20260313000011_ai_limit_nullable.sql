-- ai_limit_per_window を NULL 許容に変更
-- NULL = 無制限（Enterprise）、0 = AI利用不可（Free）、正の整数 = その回数まで
ALTER TABLE public.organizations
  ALTER COLUMN ai_limit_per_window DROP NOT NULL;

-- 既存の Enterprise プランは 0（旧・無制限マーカー）→ NULL（新・無制限マーカー）に更新
UPDATE public.organizations
  SET ai_limit_per_window = NULL
  WHERE subscription_plan = 'enterprise'
    AND ai_limit_per_window = 0;

-- 既存の Pro プランも旧値（0）から新値（50）に更新
-- ※ カスタム設定済みの組織は除外（0 のもののみ対象）
UPDATE public.organizations
  SET ai_limit_per_window = 50
  WHERE subscription_plan = 'pro'
    AND ai_limit_per_window = 0;

-- 旧デフォルト値（10）のまま残っている Free プランは 0 に更新
UPDATE public.organizations
  SET ai_limit_per_window = 0
  WHERE subscription_plan = 'free'
    AND ai_limit_per_window = 10;

-- 旧デフォルト値（10）のまま残っている Starter プランは 15 に更新
UPDATE public.organizations
  SET ai_limit_per_window = 15
  WHERE subscription_plan = 'starter'
    AND ai_limit_per_window = 10;

-- 旧デフォルト値（10）のまま残っている Standard プランは 30 に更新
UPDATE public.organizations
  SET ai_limit_per_window = 30
  WHERE subscription_plan = 'standard'
    AND ai_limit_per_window = 10;

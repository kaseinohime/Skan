-- organizationsテーブルにStripe連携カラムを追加
-- 既存の subscription_plan CHECK制約を 'standard' に対応させる
ALTER TABLE public.organizations
  DROP CONSTRAINT IF EXISTS organizations_subscription_plan_check;

ALTER TABLE public.organizations
  ADD CONSTRAINT organizations_subscription_plan_check
    CHECK (subscription_plan IN ('free', 'starter', 'standard', 'pro', 'enterprise'));

-- Stripe連携カラムを追加
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'active'
    CHECK (subscription_status IN ('active', 'trialing', 'past_due', 'canceled', 'incomplete')),
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;

-- インデックス
CREATE INDEX IF NOT EXISTS idx_organizations_stripe_customer ON public.organizations(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_organizations_stripe_subscription ON public.organizations(stripe_subscription_id);

COMMENT ON COLUMN public.organizations.stripe_customer_id IS 'Stripe 顧客ID (cus_xxx)';
COMMENT ON COLUMN public.organizations.stripe_subscription_id IS 'Stripe サブスクリプションID (sub_xxx)';
COMMENT ON COLUMN public.organizations.subscription_status IS 'サブスク状態: active/trialing/past_due/canceled/incomplete';
COMMENT ON COLUMN public.organizations.current_period_end IS '現在のサブスク期間終了日';

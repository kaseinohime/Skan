-- 監査ログに IP アドレスと User-Agent を追加
ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS ip_address TEXT,
  ADD COLUMN IF NOT EXISTS user_agent TEXT;

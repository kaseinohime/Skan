-- RLS を経由せず、認証ユーザー自身の public.users 行を返す
-- Middleware / getCurrentUser で 500 が出る場合の回避用（auth.uid() のみ使用）
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS SETOF public.users
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT * FROM public.users WHERE id = auth.uid() AND is_active = true LIMIT 1;
$$;

-- RPC は anon で呼べるが、auth.uid() が設定されている場合のみ行が返る
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO anon;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;

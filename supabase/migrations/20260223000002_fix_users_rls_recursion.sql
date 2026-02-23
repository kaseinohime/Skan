-- users テーブルの RLS が「マスターか」判定で自身を参照して無限再帰するため、
-- SECURITY DEFINER の is_master() で RLS をバイパスして判定する

CREATE OR REPLACE FUNCTION public.is_master()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND system_role = 'master'
  );
$$;

-- users のマスター用ポリシーを is_master() に差し替え
DROP POLICY IF EXISTS "users_select_master" ON public.users;
CREATE POLICY "users_select_master"
  ON public.users FOR SELECT
  USING (public.is_master());

DROP POLICY IF EXISTS "users_update_master" ON public.users;
CREATE POLICY "users_update_master"
  ON public.users FOR UPDATE
  USING (public.is_master())
  WITH CHECK (public.is_master());

GRANT EXECUTE ON FUNCTION public.is_master() TO anon;
GRANT EXECUTE ON FUNCTION public.is_master() TO authenticated;

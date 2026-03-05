-- staffロールの組織メンバーもクライアントにアクセスできるよう修正
-- 従来: agency_adminのみ → 変更後: 全アクティブ組織メンバー（staff含む）
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
    WHERE c.id = cid AND om.user_id = auth.uid() AND om.is_active = true
  );
$$;

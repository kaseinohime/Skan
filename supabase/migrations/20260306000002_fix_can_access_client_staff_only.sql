-- can_access_client を修正:
-- staff は client_members に追加されたクライアントのみアクセス可能（担当クライアントのみ）
-- agency_admin は自組織の全クライアントにアクセス可能
-- 旧: 同一組織の全メンバー（staffも）が全クライアントにアクセス可能（意図しない過剰アクセス）

CREATE OR REPLACE FUNCTION public.can_access_client(cid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT public.is_master()
  OR EXISTS (
    -- client_members に登録済み（staff・client ロールでのアクセス）
    SELECT 1 FROM public.client_members cm
    WHERE cm.client_id = cid AND cm.user_id = auth.uid() AND cm.is_active = true
  )
  OR EXISTS (
    -- 当該クライアントが属する組織で agency_admin として参加している
    SELECT 1 FROM public.clients c
    JOIN public.organization_members om ON om.organization_id = c.organization_id
    WHERE c.id = cid
      AND om.user_id = auth.uid()
      AND om.role = 'agency_admin'
      AND om.is_active = true
  );
$$;

-- organization_members の RLS が自身を参照して無限再帰するため、
-- SECURITY DEFINER の is_organization_member(org_id) で判定する

CREATE OR REPLACE FUNCTION public.is_organization_member(org_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = org_id AND user_id = auth.uid() AND is_active = true
  );
$$;

DROP POLICY IF EXISTS "members_select_own_org_members" ON public.organization_members;
CREATE POLICY "members_select_own_org_members"
  ON public.organization_members FOR SELECT
  USING (public.is_organization_member(organization_id));

GRANT EXECUTE ON FUNCTION public.is_organization_member(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.is_organization_member(uuid) TO authenticated;

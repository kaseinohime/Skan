-- 企業管理者が自組織のスタッフ招待（organization_invitations）を行えるようにする

-- 企業管理者は自組織の招待を閲覧可能
CREATE POLICY "org_invitations_agency_admin_select"
  ON public.organization_invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = organization_invitations.organization_id
        AND om.user_id = auth.uid()
        AND om.role = 'agency_admin'
        AND om.is_active = true
    )
  );

-- 企業管理者は自組織への招待を追加可能
CREATE POLICY "org_invitations_agency_admin_insert"
  ON public.organization_invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = organization_invitations.organization_id
        AND om.user_id = auth.uid()
        AND om.role = 'agency_admin'
        AND om.is_active = true
    )
  );

-- 企業管理者は自組織の招待を削除可能（取り消し）
CREATE POLICY "org_invitations_agency_admin_delete"
  ON public.organization_invitations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = organization_invitations.organization_id
        AND om.user_id = auth.uid()
        AND om.role = 'agency_admin'
        AND om.is_active = true
    )
  );

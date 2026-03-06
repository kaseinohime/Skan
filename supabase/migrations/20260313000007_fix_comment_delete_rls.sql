-- コメント削除ポリシーを修正（20260306000001 の再適用・順序保証版）
-- 旧: can_access_client を持つ全ユーザーが削除可
-- 新: 自分のコメント、または agency_admin / master のみ削除可

DROP POLICY IF EXISTS "review_comments_delete" ON public.review_comments;

CREATE POLICY "review_comments_delete" ON public.review_comments
  FOR DELETE USING (
    -- 自分のコメントは誰でも削除可
    user_id = auth.uid()
    -- マスターは任意のコメントを削除可
    OR public.is_master()
    -- 当該投稿が属する組織の agency_admin は削除可
    OR EXISTS (
      SELECT 1
      FROM public.posts p
      JOIN public.clients c ON c.id = p.client_id
      JOIN public.organization_members om ON om.organization_id = c.organization_id
      WHERE p.id = review_comments.post_id
        AND om.user_id = auth.uid()
        AND om.role = 'agency_admin'
        AND om.is_active = true
    )
  );

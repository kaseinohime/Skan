-- users テーブルの RLS を拡張:
-- 同一組織・同一クライアントのメンバー同士が互いのプロフィールを参照できるようにする
-- 旧: 自分自身と master のみ参照可能
-- 新: + 同一組織メンバー / 同一クライアントメンバー も参照可能

DROP POLICY IF EXISTS "users_select_same_org_member" ON public.users;
DROP POLICY IF EXISTS "users_select_same_client_member" ON public.users;

-- 同一組織のメンバー同士は互いのユーザー情報を参照可
-- （スタッフ一覧・担当者ドロップダウン・チームページ等で名前が表示されるようにするため）
CREATE POLICY "users_select_same_org_member"
  ON public.users FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.organization_members om1
      JOIN public.organization_members om2
        ON om1.organization_id = om2.organization_id
      WHERE om1.user_id = auth.uid()
        AND om2.user_id = users.id
        AND om1.is_active = true
        AND om2.is_active = true
    )
  );

-- 同一クライアントのメンバー同士は互いのユーザー情報を参照可
-- （外部クライアントユーザーが組織メンバーではない場合もあるため個別に定義）
CREATE POLICY "users_select_same_client_member"
  ON public.users FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.client_members cm1
      JOIN public.client_members cm2
        ON cm1.client_id = cm2.client_id
      WHERE cm1.user_id = auth.uid()
        AND cm2.user_id = users.id
        AND cm1.is_active = true
        AND cm2.is_active = true
    )
  );

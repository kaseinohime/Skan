-- 指定メールのユーザーを削除する（マスター以外を消す用）
-- Supabase SQL Editor で実行してください。
-- 削除対象のメールを以下に指定してから実行すること（以下は架空の例）

-- 1) 招待レコード（メールで紐づく）
DELETE FROM public.organization_invitations
WHERE email IN ('delete-me-1@example.co.jp', 'delete-me-2@example.co.jp');

DELETE FROM public.client_invitations
WHERE email IN ('delete-me-1@example.co.jp', 'delete-me-2@example.co.jp');

-- 2) メンバー関連（user_id で紐づく）
DELETE FROM public.organization_members
WHERE user_id IN (SELECT id FROM public.users WHERE email IN ('delete-me-1@example.co.jp', 'delete-me-2@example.co.jp'));

DELETE FROM public.client_members
WHERE user_id IN (SELECT id FROM public.users WHERE email IN ('delete-me-1@example.co.jp', 'delete-me-2@example.co.jp'));

-- 3) アプリのユーザー行
DELETE FROM public.users
WHERE email IN ('delete-me-1@example.co.jp', 'delete-me-2@example.co.jp');

-- 4) Supabase Auth のユーザー（SQL Editor で実行。権限エラーなら Dashboard から手動削除）
DELETE FROM auth.users
WHERE email IN ('delete-me-1@example.co.jp', 'delete-me-2@example.co.jp');

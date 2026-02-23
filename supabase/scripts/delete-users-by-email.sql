-- 指定メールのユーザーを削除する（マスター以外を消す用）
-- Supabase SQL Editor で実行してください。
-- 削除対象: himenoreality@gmail.com, ayakareality@gmail.com

-- 1) 招待レコード（メールで紐づく）
DELETE FROM public.organization_invitations
WHERE email IN ('himenoreality@gmail.com', 'ayakareality@gmail.com');

DELETE FROM public.client_invitations
WHERE email IN ('himenoreality@gmail.com', 'ayakareality@gmail.com');

-- 2) メンバー関連（user_id で紐づく）
DELETE FROM public.organization_members
WHERE user_id IN (SELECT id FROM public.users WHERE email IN ('himenoreality@gmail.com', 'ayakareality@gmail.com'));

DELETE FROM public.client_members
WHERE user_id IN (SELECT id FROM public.users WHERE email IN ('himenoreality@gmail.com', 'ayakareality@gmail.com'));

-- 3) アプリのユーザー行
DELETE FROM public.users
WHERE email IN ('himenoreality@gmail.com', 'ayakareality@gmail.com');

-- 4) Supabase Auth のユーザー（SQL Editor で実行。権限エラーなら Dashboard から手動削除）
DELETE FROM auth.users
WHERE email IN ('himenoreality@gmail.com', 'ayakareality@gmail.com');

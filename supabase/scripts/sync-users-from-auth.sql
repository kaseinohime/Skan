-- auth.users に存在するが public.users にいないユーザーを public.users に追加する
-- 手動で Auth に追加したユーザーや、トリガー適用前に作ったユーザー用
-- Supabase SQL Editor で実行してください

INSERT INTO public.users (id, email, full_name, avatar_url, system_role, is_active)
SELECT
  au.id,
  COALESCE(au.email, ''),
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    split_part(COALESCE(au.email, ''), '@', 1)
  ),
  au.raw_user_meta_data->>'avatar_url',
  COALESCE(au.raw_user_meta_data->>'system_role', 'staff'),
  true
FROM auth.users au
WHERE au.id NOT IN (SELECT id FROM public.users)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url,
  is_active = true,
  updated_at = now();

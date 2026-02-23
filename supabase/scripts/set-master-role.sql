-- 指定したメールアドレスのユーザーをマスターに設定する
-- Supabase SQL Editor で実行し、'your@email.com' を実際のメールに置き換えてください

UPDATE public.users
SET system_role = 'master'
WHERE email = 'your@email.com';

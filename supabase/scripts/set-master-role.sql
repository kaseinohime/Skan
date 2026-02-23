-- 指定したメールアドレスのユーザーをマスターに設定する
-- ※ ロールは auth.users ではなく public.users の system_role で管理しています。
-- 初回のみ Supabase ダッシュボード → SQL Editor で実行し、
-- 'your@email.com' を実際のログインメールアドレスに置き換えてください。

-- 1) 既に public.users に行がある場合（通常はサインアップ時にトリガーで作成される）
UPDATE public.users
SET system_role = 'master'
WHERE email = 'your@email.com';

-- 2) 行がない場合（トリガーより先にユーザーを作った場合）は以下で挿入してから 1) を再実行
-- INSERT INTO public.users (id, email, full_name, system_role)
-- SELECT id, email, COALESCE(raw_user_meta_data->>'full_name', email), 'master'
-- FROM auth.users
-- WHERE email = 'your@email.com'
-- ON CONFLICT (id) DO UPDATE SET system_role = 'master';

-- 実行後、そのメールでログインし直すと /master にアクセスできます。
-- マスターになったら /master/users で他のユーザーのロールも変更できます。

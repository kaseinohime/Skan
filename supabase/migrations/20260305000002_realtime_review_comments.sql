-- Realtime 用（テーブルが既に存在し、publication に未追加の場合のみ実行）
-- 通常は 20260305000001 でテーブル作成と同時に publication に追加されるため、このファイルは既存DBで 000001 のみ適用済みのときに有効
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'review_comments'
  )
  AND NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'review_comments'
  )
  THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.review_comments;
  END IF;
END $$;

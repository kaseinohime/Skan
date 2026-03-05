-- ai_usage の usage_type に insights_suggest を追加
ALTER TABLE public.ai_usage
  DROP CONSTRAINT IF EXISTS ai_usage_usage_type_check;

ALTER TABLE public.ai_usage
  ADD CONSTRAINT ai_usage_usage_type_check
  CHECK (usage_type IN ('caption', 'hashtag', 'insights_suggest'));


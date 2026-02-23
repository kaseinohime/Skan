import { createClient } from "@supabase/supabase-js";

/**
 * サーバー専用。RLS をバイパスし、Auth Admin API を使う場合のみ使用すること。
 * 環境変数 SUPABASE_SERVICE_ROLE_KEY が必要。
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing Supabase env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY"
    );
  }
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

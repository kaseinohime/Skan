import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { getPendingApprovalPosts } from "@/lib/approval";
import { NextResponse } from "next/server";

/**
 * 自分が承認すべき投稿一覧（pending_review かつ現在のステップの承認者であるもの）
 */
export async function GET() {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "ログインしてください。" } },
      { status: 401 }
    );
  }

  const supabase = await createClient();
  const posts = await getPendingApprovalPosts(supabase, user);
  return NextResponse.json({ posts });
}

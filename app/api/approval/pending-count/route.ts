import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * 全体の承認待ち件数（自分が承認可能なものに限らず、pending_review 件数を返す）
 * サイドバーのバッジ表示用
 */
export async function GET() {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json({ count: 0 }, { status: 401 });
  }

  const supabase = await createClient();
  const { count } = await supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending_review");

  return NextResponse.json({ count: count ?? 0 });
}

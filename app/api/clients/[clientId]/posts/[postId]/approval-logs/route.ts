import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * 投稿の承認履歴を取得
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ clientId: string; postId: string }> }
) {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "ログインしてください。" } },
      { status: 401 }
    );
  }

  const { clientId, postId } = await params;
  const supabase = await createClient();

  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("id")
    .eq("id", postId)
    .eq("client_id", clientId)
    .single();

  if (postError || !post) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "投稿が見つかりません。" } },
      { status: 404 }
    );
  }

  const { data: logs, error } = await supabase
    .from("approval_logs")
    .select("id, step_order, step_name, action, comment, acted_by, acted_at")
    .eq("post_id", postId)
    .order("acted_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: error.message } },
      { status: 500 }
    );
  }

  const actedByIds = [...new Set((logs ?? []).map((l) => l.acted_by).filter(Boolean))] as string[];
  let names: Record<string, string> = {};
  if (actedByIds.length > 0) {
    const { data: users } = await supabase
      .from("users")
      .select("id, full_name")
      .in("id", actedByIds);
    if (users) {
      names = Object.fromEntries(users.map((u) => [u.id, u.full_name ?? ""]));
    }
  }

  const list = (logs ?? []).map((l) => ({
    ...l,
    acted_by_name: names[l.acted_by] ?? null,
  }));

  return NextResponse.json({ logs: list });
}

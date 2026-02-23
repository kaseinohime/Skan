import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { NextResponse } from "next/server";

/** 自分の通知一覧（未読優先・新しい順） */
export async function GET(request: Request) {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "ログインしてください。" } },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit")) || 20, 50);
  const unreadOnly = searchParams.get("unread") === "true";

  const supabase = await createClient();
  let q = supabase
    .from("notifications")
    .select("id, title, body, type, reference_type, reference_id, is_read, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (unreadOnly) {
    q = q.eq("is_read", false);
  }

  const { data: notifications, error } = await q;

  if (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ notifications: notifications ?? [] });
}

import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { NextResponse } from "next/server";

/** 通知を既読にする */
export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "ログインしてください。" } },
      { status: 401 }
    );
  }

  const { notificationId } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: error.message } },
      { status: 500 }
    );
  }
  if (!data) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "通知が見つかりません。" } },
      { status: 404 }
    );
  }

  return NextResponse.json({ notification: data });
}

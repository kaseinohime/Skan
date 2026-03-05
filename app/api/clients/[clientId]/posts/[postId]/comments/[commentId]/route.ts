import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ clientId: string; postId: string; commentId: string }> }
) {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "ログインしてください。" } },
      { status: 401 }
    );
  }

  const { clientId, postId, commentId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "JSON を解析できません。" } },
      { status: 400 }
    );
  }

  const comment_status =
    typeof body === "object" &&
    body !== null &&
    "comment_status" in body &&
    ((body as { comment_status: string }).comment_status === "open" ||
      (body as { comment_status: string }).comment_status === "resolved")
      ? (body as { comment_status: "open" | "resolved" }).comment_status
      : undefined;

  if (comment_status === undefined) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "comment_status を指定してください。" } },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const { data: post } = await supabase
    .from("posts")
    .select("id")
    .eq("id", postId)
    .eq("client_id", clientId)
    .single();

  if (!post) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "投稿が見つかりません。" } },
      { status: 404 }
    );
  }

  const { data: comment, error } = await supabase
    .from("review_comments")
    .update({ comment_status })
    .eq("id", commentId)
    .eq("post_id", postId)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: error.message } },
      { status: 500 }
    );
  }
  if (!comment) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "コメントが見つかりません。" } },
      { status: 404 }
    );
  }

  return NextResponse.json({ comment });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ clientId: string; postId: string; commentId: string }> }
) {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "ログインしてください。" } },
      { status: 401 }
    );
  }

  const { clientId, postId, commentId } = await params;
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("posts")
    .select("id")
    .eq("id", postId)
    .eq("client_id", clientId)
    .single();

  if (!post) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "投稿が見つかりません。" } },
      { status: 404 }
    );
  }

  const { error } = await supabase
    .from("review_comments")
    .delete()
    .eq("id", commentId)
    .eq("post_id", postId);

  if (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}

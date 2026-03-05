import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { NextResponse } from "next/server";

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

  const { data: comments, error } = await supabase
    .from("review_comments")
    .select("id, post_id, user_id, content, target_type, target_index, target_timestamp_sec, comment_status, parent_id, created_at, updated_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: error.message } },
      { status: 500 }
    );
  }

  const userIds = [...new Set((comments ?? []).map((c) => c.user_id).filter(Boolean))] as string[];
  let users: { id: string; full_name: string }[] = [];
  if (userIds.length > 0) {
    const { data: u } = await supabase
      .from("users")
      .select("id, full_name")
      .in("id", userIds);
    users = u ?? [];
  }
  const userMap = Object.fromEntries(users.map((u) => [u.id, u.full_name ?? ""]));

  const list = (comments ?? []).map((c) => ({
    ...c,
    user_name: userMap[c.user_id] ?? null,
  }));

  return NextResponse.json({ comments: list });
}

export async function POST(
  request: Request,
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "JSON を解析できません。" } },
      { status: 400 }
    );
  }

  const content =
    typeof body === "object" && body !== null && "content" in body && typeof (body as { content: unknown }).content === "string"
      ? (body as { content: string }).content.trim()
      : "";
  const target_type =
    typeof body === "object" &&
    body !== null &&
    "target_type" in body &&
    ["image", "video", "caption", "general"].includes((body as { target_type: string }).target_type)
      ? (body as { target_type: "image" | "video" | "caption" | "general" }).target_type
      : null;
  const target_index =
    typeof body === "object" && body !== null && "target_index" in body && typeof (body as { target_index: unknown }).target_index === "number"
      ? (body as { target_index: number }).target_index
      : null;
  const target_timestamp_sec =
    typeof body === "object" &&
    body !== null &&
    "target_timestamp_sec" in body &&
    (typeof (body as { target_timestamp_sec: unknown }).target_timestamp_sec === "number" ||
      typeof (body as { target_timestamp_sec: unknown }).target_timestamp_sec === "string")
      ? Number((body as { target_timestamp_sec: number | string }).target_timestamp_sec)
      : null;
  const parent_id =
    typeof body === "object" &&
    body !== null &&
    "parent_id" in body &&
    ((body as { parent_id: unknown }).parent_id === null ||
      typeof (body as { parent_id: string }).parent_id === "string")
      ? (body as { parent_id: string | null }).parent_id
      : null;

  if (!content) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "コメント内容を入力してください。" } },
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
    .insert({
      post_id: postId,
      user_id: user.id,
      content,
      target_type: target_type ?? null,
      target_index: target_index ?? null,
      target_timestamp_sec: target_timestamp_sec ?? null,
      parent_id: parent_id ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: error.message } },
      { status: 500 }
    );
  }

  // コメント追加時：担当者・同一投稿のコメント投稿者に通知（自分を除く）
  const { data: postWithClient } = await supabase
    .from("posts")
    .select("id, title, client_id")
    .eq("id", postId)
    .single();

  if (postWithClient?.client_id) {
    const { data: client } = await supabase
      .from("clients")
      .select("assigned_to")
      .eq("id", postWithClient.client_id)
      .single();

    const { data: otherComments } = await supabase
      .from("review_comments")
      .select("user_id")
      .eq("post_id", postId)
      .neq("user_id", user.id);

    const notifyIds = new Set<string>();
    if (client?.assigned_to) notifyIds.add(client.assigned_to);
    (otherComments ?? []).forEach((c) => notifyIds.add(c.user_id));
    notifyIds.delete(user.id);

    const title = "新しいコメント";
    const body = `${postWithClient.title ?? "投稿"}にコメントが追加されました。`;

    for (const uid of notifyIds) {
      await supabase.rpc("create_notification", {
        p_user_id: uid,
        p_title: title,
        p_body: body,
        p_type: "comment",
        p_reference_type: "post",
        p_reference_id: postId,
      });
    }
  }

  return NextResponse.json({
    comment: {
      ...comment,
      user_name: user.full_name ?? null,
    },
  });
}

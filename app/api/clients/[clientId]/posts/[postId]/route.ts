import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import {
  updatePostSchema,
  patchPostStatusSchema,
  patchPostScheduleSchema,
} from "@/lib/validations/post";
import { NextResponse } from "next/server";

function getClientPost(supabase: Awaited<ReturnType<typeof createClient>>, clientId: string, postId: string) {
  return supabase
    .from("posts")
    .select("*")
    .eq("id", postId)
    .eq("client_id", clientId)
    .single();
}

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
  const { data: post, error } = await getClientPost(supabase, clientId, postId);

  if (error || !post) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "投稿が見つかりません。" } },
      { status: 404 }
    );
  }

  return NextResponse.json({ post });
}

export async function PATCH(
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

  const supabase = await createClient();

  // status のみの PATCH
  const statusParsed = patchPostStatusSchema.safeParse(body);
  if (statusParsed.success) {
    const { data: post, error } = await supabase
      .from("posts")
      .update({ status: statusParsed.data.status })
      .eq("id", postId)
      .eq("client_id", clientId)
      .select()
      .single();
    if (error) {
      return NextResponse.json(
        { error: { code: "INTERNAL_ERROR", message: error.message } },
        { status: 500 }
      );
    }
    if (!post) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "投稿が見つかりません。" } },
        { status: 404 }
      );
    }
    if (statusParsed.data.status === "pending_review" && post.assigned_to) {
      await supabase.rpc("create_notification", {
        p_user_id: post.assigned_to,
        p_title: "承認依頼",
        p_body: `「${post.title}」が承認待ちです`,
        p_type: "approval_request",
        p_reference_type: "post",
        p_reference_id: postId,
      });
    }
    return NextResponse.json({ post });
  }

  // scheduled_at のみの PATCH（カレンダー D&D 用）
  const scheduleParsed = patchPostScheduleSchema.safeParse(body);
  if (scheduleParsed.success) {
    const { data: post, error } = await supabase
      .from("posts")
      .update({ scheduled_at: scheduleParsed.data.scheduled_at })
      .eq("id", postId)
      .eq("client_id", clientId)
      .select()
      .single();
    if (error) {
      return NextResponse.json(
        { error: { code: "INTERNAL_ERROR", message: error.message } },
        { status: 500 }
      );
    }
    if (!post) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "投稿が見つかりません。" } },
        { status: 404 }
      );
    }
    return NextResponse.json({ post });
  }

  // 通常の部分更新
  const parsed = updatePostSchema.safeParse(body);
  if (!parsed.success) {
    const msg =
      parsed.error.flatten().fieldErrors?.title?.[0] ?? "入力内容を確認してください。";
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: msg } },
      { status: 400 }
    );
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.campaign_id !== undefined) updates.campaign_id = parsed.data.campaign_id ?? null;
  if (parsed.data.title !== undefined) updates.title = parsed.data.title;
  if (parsed.data.caption !== undefined) updates.caption = parsed.data.caption ?? null;
  if (parsed.data.hashtags !== undefined) updates.hashtags = parsed.data.hashtags;
  if (parsed.data.post_type !== undefined) updates.post_type = parsed.data.post_type;
  if (parsed.data.platform !== undefined) updates.platform = parsed.data.platform;
  if (parsed.data.status !== undefined) updates.status = parsed.data.status;
  if (parsed.data.scheduled_at !== undefined)
    updates.scheduled_at =
      parsed.data.scheduled_at && parsed.data.scheduled_at !== "" ? parsed.data.scheduled_at : null;
  if (parsed.data.media_urls !== undefined) {
    updates.media_urls = (parsed.data.media_urls ?? []).filter((u) => u !== "");
  }
  if (parsed.data.media_type !== undefined) updates.media_type = parsed.data.media_type ?? null;
  if (parsed.data.assigned_to !== undefined) updates.assigned_to = parsed.data.assigned_to ?? null;

  const { data: post, error } = await supabase
    .from("posts")
    .update(updates)
    .eq("id", postId)
    .eq("client_id", clientId)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: error.message } },
      { status: 500 }
    );
  }
  if (!post) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "投稿が見つかりません。" } },
      { status: 404 }
    );
  }

  if (parsed.data.status === "pending_review" && post.assigned_to) {
    await supabase.rpc("create_notification", {
      p_user_id: post.assigned_to,
      p_title: "承認依頼",
      p_body: `「${post.title}」が承認待ちです`,
      p_type: "approval_request",
      p_reference_type: "post",
      p_reference_id: postId,
    });
  }

  return NextResponse.json({ post });
}

export async function DELETE(
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
  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId)
    .eq("client_id", clientId);

  if (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}

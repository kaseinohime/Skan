import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ clientId: string; postId: string }> };

export async function POST(_req: Request, { params }: Params) {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "ログインしてください。" } },
      { status: 401 }
    );
  }
  if (user.system_role === "client") {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "権限がありません。" } },
      { status: 403 }
    );
  }

  const { clientId, postId } = await params;
  const supabase = await createClient();

  const { data: original, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", postId)
    .eq("client_id", clientId)
    .single();

  if (error || !original) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "投稿が見つかりません。" } },
      { status: 404 }
    );
  }

  const { data: newPost, error: insertError } = await supabase
    .from("posts")
    .insert({
      client_id: original.client_id,
      campaign_id: original.campaign_id,
      title: `${original.title}（コピー）`,
      caption: original.caption,
      hashtags: original.hashtags,
      post_type: original.post_type,
      platform: original.platform,
      media_urls: original.media_urls,
      media_type: original.media_type,
      status: "draft",
      scheduled_at: null,
    })
    .select("id")
    .single();

  if (insertError || !newPost) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "複製に失敗しました。" } },
      { status: 500 }
    );
  }

  return NextResponse.json({ post: newPost });
}

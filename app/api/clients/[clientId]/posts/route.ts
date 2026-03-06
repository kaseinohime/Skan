import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { createPostSchema } from "@/lib/validations/post";
import { logAudit, getClientAuditContext } from "@/lib/audit";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "ログインしてください。" } },
      { status: 401 }
    );
  }

  const { clientId } = await params;
  const { searchParams } = new URL(request.url);
  const campaignId = searchParams.get("campaign_id");

  const supabase = await createClient();
  let q = supabase
    .from("posts")
    .select("*")
    .eq("client_id", clientId)
    .order("scheduled_at", { ascending: true, nullsFirst: false });

  if (campaignId) {
    q = q.eq("campaign_id", campaignId);
  }

  const { data: posts, error } = await q;

  if (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ posts: posts ?? [] });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "ログインしてください。" } },
      { status: 401 }
    );
  }
  if (user.system_role === "client") {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "クライアントは投稿を作成できません。" } },
      { status: 403 }
    );
  }

  const { clientId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "JSON を解析できません。" } },
      { status: 400 }
    );
  }

  const parsed = createPostSchema.safeParse(body);
  if (!parsed.success) {
    const msg =
      parsed.error.flatten().fieldErrors?.title?.[0] ?? "入力内容を確認してください。";
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: msg } },
      { status: 400 }
    );
  }

  const mediaUrls = (parsed.data.media_urls ?? []).filter((u) => u !== "");
  const supabase = await createClient();
  const row = {
    client_id: clientId,
    campaign_id: parsed.data.campaign_id ?? null,
    title: parsed.data.title,
    caption: parsed.data.caption ?? null,
    hashtags: parsed.data.hashtags ?? [],
    post_type: parsed.data.post_type,
    platform: parsed.data.platform,
    status: parsed.data.status,
    scheduled_at:
      parsed.data.scheduled_at && parsed.data.scheduled_at !== ""
        ? parsed.data.scheduled_at
        : null,
    media_urls: mediaUrls,
    media_type: parsed.data.media_type ?? null,
    assigned_to: parsed.data.assigned_to ?? null,
    created_by: user.id,
  };

  const { data: post, error } = await supabase
    .from("posts")
    .insert(row)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: error.message } },
      { status: 500 }
    );
  }

  const ctx = await getClientAuditContext(supabase, clientId);
  await logAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: "投稿を作成",
    entityType: "post",
    entityId: post!.id,
    entityLabel: post!.title,
    ...ctx,
    clientId,
    metadata: { platform: post!.platform, post_type: post!.post_type, status: post!.status },
    request,
  });

  return NextResponse.json({ post });
}

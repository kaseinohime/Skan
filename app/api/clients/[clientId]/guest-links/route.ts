import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { PLAN_LIMITS, type Plan } from "@/lib/plans";
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

export async function GET(
  _request: Request,
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
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .single();

  if (!client) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "クライアントが見つかりません。" } },
      { status: 404 }
    );
  }

  const { data: links, error } = await supabase
    .from("guest_links")
    .select("id, token, scope, campaign_id, post_id, expires_at, is_active, created_at")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ links: links ?? [] });
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

  const scope =
    typeof body === "object" &&
    body !== null &&
    "scope" in body &&
    ["client", "campaign", "post"].includes((body as { scope: string }).scope)
      ? (body as { scope: "client" | "campaign" | "post" }).scope
      : "client";
  const expiresAt =
    typeof body === "object" &&
    body !== null &&
    "expiresAt" in body &&
    (typeof (body as { expiresAt: unknown }).expiresAt === "string" ||
      (body as { expiresAt: unknown }).expiresAt === null)
      ? (body as { expiresAt: string | null }).expiresAt
      : null;
  const campaignId =
    typeof body === "object" &&
    body !== null &&
    "campaignId" in body &&
    ((body as { campaignId: unknown }).campaignId === null ||
      typeof (body as { campaignId: string }).campaignId === "string")
      ? (body as { campaignId: string | null }).campaignId
      : null;
  const postId =
    typeof body === "object" &&
    body !== null &&
    "postId" in body &&
    ((body as { postId: unknown }).postId === null ||
      typeof (body as { postId: string }).postId === "string")
      ? (body as { postId: string | null }).postId
      : null;

  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("id, organization_id")
    .eq("id", clientId)
    .single();

  if (!client) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "クライアントが見つかりません。" } },
      { status: 404 }
    );
  }

  // プラン制限チェック（guestLinks）
  const { data: orgData } = await supabase
    .from("organizations")
    .select("subscription_plan")
    .eq("id", client.organization_id)
    .single();
  const plan = ((orgData?.subscription_plan ?? "free") as Plan);
  const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
  if (!limits.guestLinks) {
    return NextResponse.json(
      { error: { code: "PLAN_LIMIT", message: "現在のプランではゲスト共有リンクを使用できません。" } },
      { status: 403 }
    );
  }

  if (scope === "campaign" && !campaignId) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "企画を選択してください。" } },
      { status: 400 }
    );
  }
  if (scope === "post" && !postId) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "投稿を選択してください。" } },
      { status: 400 }
    );
  }

  const token = randomBytes(32).toString("hex");
  const expires_at =
    expiresAt && expiresAt.trim()
      ? new Date(expiresAt.trim()).toISOString()
      : null;

  const { data: link, error } = await supabase
    .from("guest_links")
    .insert({
      token,
      client_id: clientId,
      campaign_id: scope === "campaign" ? campaignId : null,
      post_id: scope === "post" ? postId : null,
      scope,
      expires_at,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: error.message } },
      { status: 500 }
    );
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "";
  const shareUrl = `${baseUrl}/shared/${token}`;

  return NextResponse.json({
    link: {
      ...link,
      share_url: shareUrl,
    },
  });
}

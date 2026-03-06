import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { updateCampaignSchema } from "@/lib/validations/campaign";
import { logAudit, getClientAuditContext } from "@/lib/audit";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ clientId: string; campaignId: string }> }
) {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "ログインしてください。" } },
      { status: 401 }
    );
  }

  const { clientId, campaignId } = await params;
  const supabase = await createClient();
  const { data: campaign, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", campaignId)
    .eq("client_id", clientId)
    .single();

  if (error || !campaign) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "企画が見つかりません。" } },
      { status: 404 }
    );
  }

  return NextResponse.json({ campaign });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ clientId: string; campaignId: string }> }
) {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "ログインしてください。" } },
      { status: 401 }
    );
  }

  const { clientId, campaignId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "JSON を解析できません。" } },
      { status: 400 }
    );
  }

  const parsed = updateCampaignSchema.safeParse(body);
  if (!parsed.success) {
    const msg =
      parsed.error.flatten().fieldErrors?.name?.[0] ?? "入力内容を確認してください。";
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: msg } },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const updates: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.description !== undefined) updates.description = parsed.data.description ?? null;
  if (parsed.data.start_date !== undefined)
    updates.start_date = parsed.data.start_date && parsed.data.start_date !== "" ? parsed.data.start_date : null;
  if (parsed.data.end_date !== undefined)
    updates.end_date = parsed.data.end_date && parsed.data.end_date !== "" ? parsed.data.end_date : null;
  if (parsed.data.status !== undefined) updates.status = parsed.data.status;

  const { data: campaign, error } = await supabase
    .from("campaigns")
    .update(updates)
    .eq("id", campaignId)
    .eq("client_id", clientId)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: error.message } },
      { status: 500 }
    );
  }
  if (!campaign) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "企画が見つかりません。" } },
      { status: 404 }
    );
  }

  const ctx = await getClientAuditContext(supabase, clientId);
  await logAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: "キャンペーンを更新",
    entityType: "campaign",
    entityId: campaignId,
    entityLabel: campaign.name,
    ...ctx,
    clientId,
    metadata: { changed_fields: Object.keys(updates) },
    request,
  });

  return NextResponse.json({ campaign });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ clientId: string; campaignId: string }> }
) {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "ログインしてください。" } },
      { status: 401 }
    );
  }

  const { clientId, campaignId } = await params;
  const supabase = await createClient();

  // 削除前に情報取得（ログ用）
  const { data: campaignRow } = await supabase
    .from("campaigns")
    .select("name")
    .eq("id", campaignId)
    .eq("client_id", clientId)
    .single();

  const { error } = await supabase
    .from("campaigns")
    .delete()
    .eq("id", campaignId)
    .eq("client_id", clientId);

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
    action: "キャンペーンを削除",
    entityType: "campaign",
    entityId: campaignId,
    entityLabel: campaignRow?.name ?? campaignId,
    ...ctx,
    clientId,
    request,
  });

  return NextResponse.json({ ok: true });
}

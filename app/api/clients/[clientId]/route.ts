import { createClient } from "@/lib/supabase/server";
import { requireRole, requireAuth } from "@/lib/auth";
import { updateClientSchema } from "@/lib/validations/client";
import { NextResponse } from "next/server";

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
  const { data: client, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .single();

  if (error || !client) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "クライアントが見つかりません。" } },
      { status: 404 }
    );
  }

  return NextResponse.json({ client });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const user = await requireRole(["master", "agency_admin"]);
  if (!user) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "企業管理者権限が必要です。" } },
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

  const parsed = updateClientSchema.safeParse(body);
  if (!parsed.success) {
    const msg =
      parsed.error.flatten().fieldErrors?.name?.[0] ??
      parsed.error.flatten().fieldErrors?.slug?.[0] ??
      "入力内容を確認してください。";
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: msg } },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const updates: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.slug !== undefined) updates.slug = parsed.data.slug;
  if (parsed.data.description !== undefined) updates.description = parsed.data.description;
  if (parsed.data.logo_url !== undefined) updates.logo_url = parsed.data.logo_url || null;
  if (parsed.data.sns_platforms !== undefined) updates.sns_platforms = parsed.data.sns_platforms;
  if (parsed.data.instagram_username !== undefined)
    updates.instagram_username = parsed.data.instagram_username ?? null;
  if (parsed.data.tiktok_username !== undefined)
    updates.tiktok_username = parsed.data.tiktok_username ?? null;
  if (parsed.data.is_active !== undefined) updates.is_active = parsed.data.is_active;
  if (parsed.data.assigned_to !== undefined) updates.assigned_to = parsed.data.assigned_to ?? null;

  const { data: client, error } = await supabase
    .from("clients")
    .update(updates)
    .eq("id", clientId)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: { code: "CONFLICT", message: "このスラッグは既に使われています。" } },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: error.message } },
      { status: 500 }
    );
  }

  if (!client) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "クライアントが見つかりません。" } },
      { status: 404 }
    );
  }

  return NextResponse.json({ client });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const user = await requireRole(["master", "agency_admin"]);
  if (!user) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "企業管理者権限が必要です。" } },
      { status: 403 }
    );
  }

  const { clientId } = await params;
  const supabase = await createClient();
  const { error } = await supabase.from("clients").delete().eq("id", clientId);

  if (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}

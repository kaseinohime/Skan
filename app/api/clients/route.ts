import { createClient } from "@/lib/supabase/server";
import { requireRole, requireAuth } from "@/lib/auth";
import { getCurrentUserAgencyOrganizationId } from "@/lib/organization";
import { createClientSchema } from "@/lib/validations/client";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "ログインしてください。" } },
      { status: 401 }
    );
  }

  const supabase = await createClient();
  const { data: clients, error } = await supabase
    .from("clients")
    .select("*")
    .order("name");

  if (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ clients: clients ?? [] });
}

export async function POST(request: Request) {
  const user = await requireRole(["master", "agency_admin"]);
  if (!user) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "企業管理者権限が必要です。" } },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "JSON を解析できません。" } },
      { status: 400 }
    );
  }

  const parsed = createClientSchema.safeParse(body);
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

  let organizationId: string | null = null;
  if (user.system_role === "master" && parsed.data.organization_id) {
    organizationId = parsed.data.organization_id;
  } else if (user.system_role === "agency_admin") {
    organizationId = await getCurrentUserAgencyOrganizationId();
  }
  if (!organizationId) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message:
            user.system_role === "master"
              ? "企業を指定してください。"
              : "所属企業がありません。",
        },
      },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { data: client, error } = await supabase
    .from("clients")
    .insert({
      organization_id: organizationId,
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description ?? null,
      logo_url: parsed.data.logo_url || null,
      sns_platforms: parsed.data.sns_platforms ?? [],
      instagram_username: parsed.data.instagram_username ?? null,
      tiktok_username: parsed.data.tiktok_username ?? null,
      is_active: true,
      created_by: user.id,
    })
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

  return NextResponse.json({ client });
}

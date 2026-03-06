import { createClient } from "@/lib/supabase/server";
import { requireRole, requireAuth } from "@/lib/auth";
import { getCurrentUserAgencyOrganizationId } from "@/lib/organization";
import { createClientSchema } from "@/lib/validations/client";
import { PLAN_LIMITS, type Plan } from "@/lib/plans";
import { logAudit } from "@/lib/audit";
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

  // プラン制限チェック
  if (user.system_role !== "master") {
    const { data: orgData } = await supabase
      .from("organizations")
      .select("subscription_plan")
      .eq("id", organizationId)
      .single();
    const plan = ((orgData?.subscription_plan ?? "free") as Plan);
    const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
    if (limits.clientLimit !== null) {
      const { count } = await supabase
        .from("clients")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("is_active", true);
      if ((count ?? 0) >= limits.clientLimit) {
        return NextResponse.json(
          { error: { code: "PLAN_LIMIT", message: `現在のプラン（${plan}）ではクライアントを${limits.clientLimit}件まで作成できます。` } },
          { status: 403 }
        );
      }
    }
  }

  // スラッグ自動生成（未指定の場合）
  let slug = parsed.data.slug;
  if (!slug) {
    const base = parsed.data.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/[\s_]+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 40) || "client";
    slug = base;
    let i = 2;
    while (true) {
      const { data: existing } = await supabase
        .from("clients")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      if (!existing) break;
      slug = `${base}-${i++}`;
    }
  }

  const { data: client, error } = await supabase
    .from("clients")
    .insert({
      organization_id: organizationId,
      name: parsed.data.name,
      slug: slug!,
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

  // 組織名を取得してログ記録
  const { data: orgRow } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", organizationId)
    .single();

  await logAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: "クライアントを作成",
    entityType: "client",
    entityId: client!.id,
    entityLabel: client!.name,
    organizationId: organizationId!,
    organizationName: orgRow?.name,
    clientId: client!.id,
    clientName: client!.name,
  });

  return NextResponse.json({ client });
}

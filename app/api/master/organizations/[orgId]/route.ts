import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { updateOrganizationSchema } from "@/lib/validations/organization";
import { NextResponse } from "next/server";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const user = await requireRole(["master"]);
  if (!user) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "マスター権限が必要です。" } },
      { status: 403 }
    );
  }

  const { orgId } = await params;

  let body: unknown;
  try {
    body = await _request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "JSON を解析できません。" } },
      { status: 400 }
    );
  }

  const parsed = updateOrganizationSchema.safeParse(body);
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
  if (parsed.data.is_active !== undefined) updates.is_active = parsed.data.is_active;

  const { error } = await supabase
    .from("organizations")
    .update(updates)
    .eq("id", orgId);

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: { code: "CONFLICT", message: "このスラグは既に使われています。" } },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}

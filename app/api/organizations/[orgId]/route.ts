import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { getCurrentUserAgencyOrganizationId } from "@/lib/organization";

type Params = { params: Promise<{ orgId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await requireRole(["master", "agency_admin"]);
  if (!user) {
    return NextResponse.json({ error: { code: "FORBIDDEN", message: "権限がありません" } }, { status: 403 });
  }

  const { orgId } = await params;

  // マスター以外は自分の組織のみ変更可能
  if (user.system_role !== "master") {
    const myOrgId = await getCurrentUserAgencyOrganizationId();
    if (myOrgId !== orgId) {
      return NextResponse.json({ error: { code: "FORBIDDEN", message: "この組織を変更する権限がありません" } }, { status: 403 });
    }
  }

  const body = await req.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : null;
  const description = typeof body.description === "string" ? body.description.trim() : undefined;

  if (!name) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "組織名を入力してください" } }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("organizations")
    .update({
      name,
      ...(description !== undefined ? { description: description || null } : {}),
    })
    .eq("id", orgId);

  if (error) {
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: error.message } }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

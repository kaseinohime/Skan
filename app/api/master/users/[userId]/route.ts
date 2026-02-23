import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { NextResponse } from "next/server";

const VALID_ROLES = ["master", "agency_admin", "staff", "client"] as const;

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const currentUser = await requireRole(["master"]);
  if (!currentUser) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "マスター権限が必要です。" } },
      { status: 403 }
    );
  }

  const { userId } = await params;

  let body: { system_role?: string };
  try {
    body = await _request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "JSON を解析できません。" } },
      { status: 400 }
    );
  }

  const role = body?.system_role;
  if (!role || !VALID_ROLES.includes(role as (typeof VALID_ROLES)[number])) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "system_role は master / agency_admin / staff / client のいずれかを指定してください。" } },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("users")
    .update({ system_role: role })
    .eq("id", userId);

  if (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}

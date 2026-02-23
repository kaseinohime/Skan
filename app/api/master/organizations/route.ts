import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { createOrganizationSchema } from "@/lib/validations/organization";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const user = await requireRole(["master"]);
  if (!user) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "マスター権限が必要です。" } },
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

  const parsed = createOrganizationSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors?.admin_email?.[0]
      ?? parsed.error.flatten().fieldErrors?.name?.[0]
      ?? parsed.error.flatten().fieldErrors?.slug?.[0]
      ?? "入力内容を確認してください。";
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: msg } },
      { status: 400 }
    );
  }

  const { name, slug, description, admin_email } = parsed.data;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:20000";

  const supabase = await createClient();

  const { data: org, error: insertOrgError } = await supabase
    .from("organizations")
    .insert({
      name,
      slug,
      description: description ?? null,
      is_active: true,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (insertOrgError) {
    if (insertOrgError.code === "23505") {
      return NextResponse.json(
        { error: { code: "CONFLICT", message: "このスラグは既に使われています。" } },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: insertOrgError.message } },
      { status: 500 }
    );
  }

  await supabase.from("organization_invitations").insert({
    organization_id: org.id,
    email: admin_email,
    role: "agency_admin",
  });

  try {
    const admin = createAdminClient();
    const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(
      admin_email,
      {
        redirectTo: `${appUrl}/auth/confirm`,
        data: { invited_to_organization: org.id },
      }
    );
    if (inviteError) {
      console.error("inviteUserByEmail error:", inviteError);
      return NextResponse.json(
        {
          error: {
            code: "INVITE_ERROR",
            message:
              "招待メールの送信に失敗しました。メールが既に登録済みの場合は、企業詳細からメンバーを追加してください。",
          },
        },
        { status: 502 }
      );
    }
  } catch (e) {
    console.error("Admin invite error:", e);
    return NextResponse.json(
      {
        error: {
          code: "INVITE_ERROR",
          message:
            "招待処理でエラーが発生しました。SUPABASE_SERVICE_ROLE_KEY を設定し、Supabase の Auth 設定でメール招待を有効にしてください。",
        },
      },
      { status: 502 }
    );
  }

  return NextResponse.json({ id: org.id, slug }, { status: 201 });
}

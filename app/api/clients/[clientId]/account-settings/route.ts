import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { accountSettingsSchema } from "@/lib/validations/insights";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ clientId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "ログインしてください。" } },
      { status: 401 }
    );
  }

  const { clientId } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("client_account_settings")
    .select("*")
    .eq("client_id", clientId)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ settings: data ?? null });
}

export async function PUT(request: Request, { params }: Params) {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "ログインしてください。" } },
      { status: 401 }
    );
  }
  if (user.system_role === "client" || user.system_role === "staff") {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "アカウント設定の編集は企業管理者のみ可能です。" } },
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

  const parsed = accountSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "入力内容を確認してください。" } },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("client_account_settings")
    .upsert(
      { client_id: clientId, ...parsed.data, updated_by: user.id },
      { onConflict: "client_id" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ settings: data });
}

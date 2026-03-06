import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureOrganization } from "@/lib/org-setup";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  // セッションから取得を試みる
  const supabase = await createClient();
  const { data: { user: sessionUser } } = await supabase.auth.getUser();

  let userId = sessionUser?.id;

  // セッションがない場合は body の user_id で検証
  if (!userId && typeof body.user_id === "string") {
    const admin = createAdminClient();
    const { data: { user: adminUser } } = await admin.auth.admin.getUserById(body.user_id);
    if (adminUser) userId = adminUser.id;
  }

  if (!userId) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  // org_name: body → セッションユーザーのメタデータの順で取得
  const orgName =
    (typeof body.org_name === "string" ? body.org_name.trim() : "") ||
    (typeof sessionUser?.user_metadata?.org_name === "string"
      ? sessionUser.user_metadata.org_name.trim()
      : "");

  if (!orgName) {
    return NextResponse.json({ error: "会社名・組織名を入力してください" }, { status: 400 });
  }

  const result = await ensureOrganization(userId, orgName);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true, organization_id: result.organization_id });
}

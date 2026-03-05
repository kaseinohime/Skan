import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ linkId: string }> }
) {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "ログインしてください。" } },
      { status: 401 }
    );
  }

  const { linkId } = await params;
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("guest_links")
    .select("id, client_id")
    .eq("id", linkId)
    .single();

  if (!existing) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "リンクが見つかりません。" } },
      { status: 404 }
    );
  }

  const { error } = await supabase
    .from("guest_links")
    .update({ is_active: false })
    .eq("id", linkId);

  if (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}

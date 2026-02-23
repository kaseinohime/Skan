import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * クライアントの担当者候補（同じ組織のメンバー + クライアントメンバー）を返す
 */
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

  const { data: rows, error } = await supabase.rpc("get_assignable_users_for_client", {
    cid: clientId,
  });

  if (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ users: Array.isArray(rows) ? rows : [] });
}

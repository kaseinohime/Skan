import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const u = await requireAuth();
  if (!u) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "ログインしてください。" } }, { status: 401 });
  const { clientId } = await params;
  const supabase = await createClient();
  const { data: rows } = await supabase.from("client_assignees").select("user_id, role").eq("client_id", clientId);
  const directors = (rows ?? []).filter((r) => r.role === "director").map((r) => r.user_id);
  const editors = (rows ?? []).filter((r) => r.role === "editor").map((r) => r.user_id);
  return NextResponse.json({ directors, editors });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const u = await requireAuth();
  if (!u) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "ログインしてください。" } }, { status: 401 });
  const { clientId } = await params;
  let body: { directors?: string[]; editors?: string[] };
  try { body = await req.json(); } catch { return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "JSON を解析できません。" } }, { status: 400 }); }
  const directors = Array.isArray(body.directors) ? body.directors.filter((id) => typeof id === "string") : [];
  const editors = Array.isArray(body.editors) ? body.editors.filter((id) => typeof id === "string") : [];
  const supabase = await createClient();
  await supabase.from("client_assignees").delete().eq("client_id", clientId);
  const insertRows = [...directors.map((user_id) => ({ client_id: clientId, user_id, role: "director" })), ...editors.map((user_id) => ({ client_id: clientId, user_id, role: "editor" }))];
  if (insertRows.length > 0) { const { error } = await supabase.from("client_assignees").insert(insertRows); if (error) return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: error.message } }, { status: 500 }); }
  return NextResponse.json({ directors, editors });
}

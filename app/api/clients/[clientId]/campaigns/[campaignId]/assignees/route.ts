import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ clientId: string; campaignId: string }> }
) {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "ログインしてください。" } },
      { status: 401 }
    );
  }

  const { campaignId } = await params;
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("campaign_assignees")
    .select("user_id, role")
    .eq("campaign_id", campaignId);

  const directors = (rows ?? []).filter((r) => r.role === "director").map((r) => r.user_id);
  const editors = (rows ?? []).filter((r) => r.role === "editor").map((r) => r.user_id);

  return NextResponse.json({ directors, editors });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ clientId: string; campaignId: string }> }
) {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "ログインしてください。" } },
      { status: 401 }
    );
  }

  const { campaignId } = await params;
  let body: { directors?: string[]; editors?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "JSON を解析できません。" } },
      { status: 400 }
    );
  }

  const directors = Array.isArray(body.directors) ? body.directors.filter((id) => typeof id === "string") : [];
  const editors = Array.isArray(body.editors) ? body.editors.filter((id) => typeof id === "string") : [];

  const supabase = await createClient();

  await supabase.from("campaign_assignees").delete().eq("campaign_id", campaignId);

  const rows: { campaign_id: string; user_id: string; role: string }[] = [
    ...directors.map((user_id) => ({ campaign_id: campaignId, user_id, role: "director" })),
    ...editors.map((user_id) => ({ campaign_id: campaignId, user_id, role: "editor" })),
  ];

  if (rows.length > 0) {
    const { error } = await supabase.from("campaign_assignees").insert(rows);
    if (error) {
      return NextResponse.json(
        { error: { code: "INTERNAL_ERROR", message: error.message } },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ directors, editors });
}

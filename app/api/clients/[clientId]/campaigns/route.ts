import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { createCampaignSchema } from "@/lib/validations/campaign";
import { NextResponse } from "next/server";

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
  const { data: campaigns, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ campaigns: campaigns ?? [] });
}

export async function POST(
  request: Request,
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "JSON を解析できません。" } },
      { status: 400 }
    );
  }

  const parsed = createCampaignSchema.safeParse(body);
  if (!parsed.success) {
    const msg =
      parsed.error.flatten().fieldErrors?.name?.[0] ?? "入力内容を確認してください。";
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: msg } },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const row = {
    client_id: clientId,
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    start_date: parsed.data.start_date && parsed.data.start_date !== "" ? parsed.data.start_date : null,
    end_date: parsed.data.end_date && parsed.data.end_date !== "" ? parsed.data.end_date : null,
    status: parsed.data.status,
    created_by: user.id,
  };

  const { data: campaign, error } = await supabase
    .from("campaigns")
    .insert(row)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ campaign });
}

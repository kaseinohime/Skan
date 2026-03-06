import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const user = await requireRole(["master"]);
  if (!user) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "マスター権限が必要です。" } },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("org_id");
  const clientId = searchParams.get("client_id");
  const actorId = searchParams.get("actor_id");
  const entityType = searchParams.get("entity_type");
  const limit = Math.min(Number(searchParams.get("limit") ?? 50), 200);
  const offset = Number(searchParams.get("offset") ?? 0);

  const supabase = await createClient();

  let q = supabase
    .from("audit_logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (orgId) q = q.eq("organization_id", orgId);
  if (clientId) q = q.eq("client_id", clientId);
  if (actorId) q = q.eq("actor_id", actorId);
  if (entityType) q = q.eq("entity_type", entityType);

  const { data, error, count } = await q;

  if (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ logs: data ?? [], total: count ?? 0 });
}

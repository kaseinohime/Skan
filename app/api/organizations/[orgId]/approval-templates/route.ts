import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { getCurrentUserAgencyOrganizationId } from "@/lib/organization";
import { NextResponse } from "next/server";

function canAccessOrg(userRole: string, userOrgId: string | null, orgId: string): boolean {
  if (userRole === "master") return true;
  return userOrgId === orgId;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const user = await requireRole(["master", "agency_admin"]);
  if (!user) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "権限がありません。" } },
      { status: 403 }
    );
  }

  const { orgId } = await params;
  const agencyOrgId = await getCurrentUserAgencyOrganizationId();
  if (!canAccessOrg(user.system_role, agencyOrgId, orgId)) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "この企業にアクセスできません。" } },
      { status: 403 }
    );
  }

  const supabase = await createClient();
  const { data: templates, error: tError } = await supabase
    .from("approval_templates")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: true });

  if (tError) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: tError.message } },
      { status: 500 }
    );
  }

  if (!templates?.length) {
    return NextResponse.json({ templates: [] });
  }

  const { data: steps, error: sError } = await supabase
    .from("approval_steps")
    .select("*")
    .in("template_id", templates.map((t) => t.id))
    .order("step_order", { ascending: true });

  if (sError) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: sError.message } },
      { status: 500 }
    );
  }

  const stepsByTemplate = new Map<string, typeof steps>();
  for (const s of steps ?? []) {
    const list = stepsByTemplate.get(s.template_id) ?? [];
    list.push(s);
    stepsByTemplate.set(s.template_id, list);
  }

  const result = (templates ?? []).map((t) => ({
    ...t,
    steps: stepsByTemplate.get(t.id) ?? [],
  }));

  return NextResponse.json({ templates: result });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const user = await requireRole(["master", "agency_admin"]);
  if (!user) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "権限がありません。" } },
      { status: 403 }
    );
  }

  const { orgId } = await params;
  const agencyOrgId = await getCurrentUserAgencyOrganizationId();
  if (!canAccessOrg(user.system_role, agencyOrgId, orgId)) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "この企業にアクセスできません。" } },
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

  const name =
    typeof body === "object" && body !== null && "name" in body && typeof (body as { name: unknown }).name === "string"
      ? (body as { name: string }).name.trim()
      : null;
  const is_default =
    typeof body === "object" && body !== null && "is_default" in body && (body as { is_default: unknown }).is_default === true;
  const stepsRaw =
    typeof body === "object" && body !== null && "steps" in body && Array.isArray((body as { steps: unknown }).steps)
      ? (body as { steps: unknown[] }).steps
      : [];

  if (!name || name.length === 0) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "テンプレート名を入力してください。" } },
      { status: 400 }
    );
  }

  const stepRoleSet = new Set(["staff", "agency_admin", "client"]);
  const steps = stepsRaw
    .map((s, i) => {
      if (typeof s !== "object" || s === null) return null;
      const stepName =
        "name" in s && typeof (s as { name: unknown }).name === "string"
          ? ((s as { name: string }).name as string).trim()
          : "";
      const required_role =
        "required_role" in s && stepRoleSet.has((s as { required_role: string }).required_role)
          ? (s as { required_role: "staff" | "agency_admin" | "client" }).required_role
          : "staff";
      const assigned_to =
        "assigned_to" in s &&
        (typeof (s as { assigned_to: unknown }).assigned_to === "string" || (s as { assigned_to: unknown }).assigned_to === null)
          ? (s as { assigned_to: string | null }).assigned_to
          : null;
      return { step_order: i, name: stepName || `ステップ ${i + 1}`, required_role, assigned_to };
    })
    .filter((s): s is NonNullable<typeof s> => s !== null);

  const supabase = await createClient();

  if (is_default) {
    await supabase
      .from("approval_templates")
      .update({ is_default: false })
      .eq("organization_id", orgId);
  }

  const { data: template, error: insertError } = await supabase
    .from("approval_templates")
    .insert({ organization_id: orgId, name, is_default: !!is_default })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: insertError.message } },
      { status: 500 }
    );
  }

  if (steps.length > 0) {
    const { error: stepsError } = await supabase.from("approval_steps").insert(
      steps.map((s) => ({
        template_id: template.id,
        step_order: s.step_order,
        name: s.name,
        required_role: s.required_role,
        assigned_to: s.assigned_to,
      }))
    );
    if (stepsError) {
      await supabase.from("approval_templates").delete().eq("id", template.id);
      return NextResponse.json(
        { error: { code: "INTERNAL_ERROR", message: stepsError.message } },
        { status: 500 }
      );
    }
  }

  const { data: stepsData } = await supabase
    .from("approval_steps")
    .select("*")
    .eq("template_id", template.id)
    .order("step_order", { ascending: true });

  return NextResponse.json({ template: { ...template, steps: stepsData ?? [] } });
}

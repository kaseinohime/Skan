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
  { params }: { params: Promise<{ orgId: string; templateId: string }> }
) {
  const user = await requireRole(["master", "agency_admin"]);
  if (!user) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "権限がありません。" } },
      { status: 403 }
    );
  }

  const { orgId, templateId } = await params;
  const agencyOrgId = await getCurrentUserAgencyOrganizationId();
  if (!canAccessOrg(user.system_role, agencyOrgId, orgId)) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "この企業にアクセスできません。" } },
      { status: 403 }
    );
  }

  const supabase = await createClient();
  const { data: template, error: tError } = await supabase
    .from("approval_templates")
    .select("*")
    .eq("id", templateId)
    .eq("organization_id", orgId)
    .single();

  if (tError || !template) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "テンプレートが見つかりません。" } },
      { status: 404 }
    );
  }

  const { data: steps } = await supabase
    .from("approval_steps")
    .select("*")
    .eq("template_id", templateId)
    .order("step_order", { ascending: true });

  return NextResponse.json({ template: { ...template, steps: steps ?? [] } });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orgId: string; templateId: string }> }
) {
  const user = await requireRole(["master", "agency_admin"]);
  if (!user) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "権限がありません。" } },
      { status: 403 }
    );
  }

  const { orgId, templateId } = await params;
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
      : undefined;
  const is_default =
    typeof body === "object" && body !== null && "is_default" in body
      ? (body as { is_default: unknown }).is_default === true
      : undefined;
  const stepsRaw =
    typeof body === "object" && body !== null && "steps" in body && Array.isArray((body as { steps: unknown }).steps)
      ? (body as { steps: unknown[] }).steps
      : undefined;

  const supabase = await createClient();

  const updates: { name?: string; is_default?: boolean } = {};
  if (name !== undefined) updates.name = name;
  if (is_default !== undefined) updates.is_default = is_default;

  if (Object.keys(updates).length > 0) {
    if (is_default === true) {
      await supabase
        .from("approval_templates")
        .update({ is_default: false })
        .eq("organization_id", orgId)
        .neq("id", templateId);
    }
    const { error: updateError } = await supabase
      .from("approval_templates")
      .update(updates)
      .eq("id", templateId)
      .eq("organization_id", orgId);
    if (updateError) {
      return NextResponse.json(
        { error: { code: "INTERNAL_ERROR", message: updateError.message } },
        { status: 500 }
      );
    }
  }

  if (stepsRaw !== undefined) {
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

    const { error: delError } = await supabase.from("approval_steps").delete().eq("template_id", templateId);
    if (delError) {
      return NextResponse.json(
        { error: { code: "INTERNAL_ERROR", message: delError.message } },
        { status: 500 }
      );
    }

    if (steps.length > 0) {
      const { error: stepsError } = await supabase.from("approval_steps").insert(
        steps.map((s) => ({
          template_id: templateId,
          step_order: s.step_order,
          name: s.name,
          required_role: s.required_role,
          assigned_to: s.assigned_to,
        }))
      );
      if (stepsError) {
        return NextResponse.json(
          { error: { code: "INTERNAL_ERROR", message: stepsError.message } },
          { status: 500 }
        );
      }
    }
  }

  const { data: template } = await supabase
    .from("approval_templates")
    .select("*")
    .eq("id", templateId)
    .single();
  const { data: stepsData } = await supabase
    .from("approval_steps")
    .select("*")
    .eq("template_id", templateId)
    .order("step_order", { ascending: true });

  return NextResponse.json({ template: { ...template, steps: stepsData ?? [] } });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ orgId: string; templateId: string }> }
) {
  const user = await requireRole(["master", "agency_admin"]);
  if (!user) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "権限がありません。" } },
      { status: 403 }
    );
  }

  const { orgId, templateId } = await params;
  const agencyOrgId = await getCurrentUserAgencyOrganizationId();
  if (!canAccessOrg(user.system_role, agencyOrgId, orgId)) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "この企業にアクセスできません。" } },
      { status: 403 }
    );
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("approval_templates")
    .delete()
    .eq("id", templateId)
    .eq("organization_id", orgId);

  if (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: error.message } },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true });
}

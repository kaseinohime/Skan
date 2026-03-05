import type { createClient } from "@/lib/supabase/server";
import type { User } from "@/types";

export type PendingApprovalPost = {
  id: string;
  client_id: string;
  client_name: string;
  title: string;
  status: string;
  current_approval_step: number;
  scheduled_at: string | null;
  created_at: string;
  can_approve: boolean;
};

export async function getPendingApprovalPosts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: User
): Promise<PendingApprovalPost[]> {
  const { data: posts } = await supabase
    .from("posts")
    .select("id, client_id, title, status, current_approval_step, scheduled_at, created_at")
    .eq("status", "pending_review")
    .order("scheduled_at", { ascending: true, nullsFirst: false });

  if (!posts?.length) return [];

  const clientIds = [...new Set(posts.map((p) => p.client_id))];
  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, organization_id")
    .in("id", clientIds);

  const clientMap = new Map((clients ?? []).map((c) => [c.id, c]));
  const orgIds = [...new Set((clients ?? []).map((c) => c.organization_id).filter(Boolean))] as string[];

  const { data: templates } = await supabase
    .from("approval_templates")
    .select("id, organization_id")
    .in("organization_id", orgIds)
    .eq("is_default", true);

  const templateByOrg = new Map((templates ?? []).map((t) => [t.organization_id, t.id]));
  const templateIds = [...new Set((templates ?? []).map((t) => t.id))];

  const { data: steps } = await supabase
    .from("approval_steps")
    .select("template_id, step_order, assigned_to, required_role")
    .in("template_id", templateIds)
    .order("step_order", { ascending: true });

  const stepsByTemplate = new Map<string, { step_order: number; assigned_to: string | null; required_role: string }[]>();
  for (const s of steps ?? []) {
    const list = stepsByTemplate.get(s.template_id) ?? [];
    list.push({
      step_order: s.step_order,
      assigned_to: s.assigned_to,
      required_role: s.required_role,
    });
    stepsByTemplate.set(s.template_id, list);
  }

  const result: PendingApprovalPost[] = [];

  for (const post of posts) {
    const client = clientMap.get(post.client_id);
    const orgId = client?.organization_id;
    const templateId = orgId ? templateByOrg.get(orgId) : null;
    const templateSteps = templateId ? stepsByTemplate.get(templateId) ?? [] : [];
    const currentStep = templateSteps[post.current_approval_step];
    let canApprove = false;
    if (currentStep) {
      if (user.system_role === "master") canApprove = true;
      else if (currentStep.assigned_to) canApprove = currentStep.assigned_to === user.id;
      else if (currentStep.required_role === "agency_admin") {
        const { data: om } = await supabase
          .from("organization_members")
          .select("id")
          .eq("organization_id", orgId)
          .eq("user_id", user.id)
          .eq("role", "agency_admin")
          .eq("is_active", true)
          .maybeSingle();
        canApprove = !!om;
      } else if (currentStep.required_role === "client") {
        const { data: cm } = await supabase
          .from("client_members")
          .select("id")
          .eq("client_id", post.client_id)
          .eq("user_id", user.id)
          .eq("role", "client")
          .eq("is_active", true)
          .maybeSingle();
        canApprove = !!cm;
      } else {
        const { data: cm } = await supabase
          .from("client_members")
          .select("id")
          .eq("client_id", post.client_id)
          .eq("user_id", user.id)
          .eq("role", "staff")
          .eq("is_active", true)
          .maybeSingle();
        const { data: om } = await supabase
          .from("organization_members")
          .select("id")
          .eq("organization_id", orgId)
          .eq("user_id", user.id)
          .eq("role", "staff")
          .eq("is_active", true)
          .maybeSingle();
        canApprove = !!cm || !!om;
      }
    }
    result.push({
      id: post.id,
      client_id: post.client_id,
      client_name: client?.name ?? "",
      title: post.title,
      status: post.status,
      current_approval_step: post.current_approval_step,
      scheduled_at: post.scheduled_at,
      created_at: post.created_at,
      can_approve: canApprove,
    });
  }

  return result.filter((r) => r.can_approve);
}

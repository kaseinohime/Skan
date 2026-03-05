import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { notFound } from "next/navigation";
import { PostDetailWithPreview } from "./post-detail-with-preview";
import type { Post } from "@/types";

export const dynamic = "force-dynamic";

async function getCanCurrentUserApprove(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  systemRole: string,
  clientId: string,
  organizationId: string,
  currentStepIndex: number,
  step: { assigned_to: string | null; required_role: string } | null
): Promise<boolean> {
  if (!step) return false;
  if (systemRole === "master") return true;
  if (step.assigned_to) return step.assigned_to === userId;
  if (step.required_role === "agency_admin") {
    const { data: om } = await supabase
      .from("organization_members")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("user_id", userId)
      .eq("role", "agency_admin")
      .eq("is_active", true)
      .maybeSingle();
    return !!om;
  }
  if (step.required_role === "client") {
    const { data: cm } = await supabase
      .from("client_members")
      .select("id")
      .eq("client_id", clientId)
      .eq("user_id", userId)
      .eq("role", "client")
      .eq("is_active", true)
      .maybeSingle();
    return !!cm;
  }
  const { data: cm } = await supabase
    .from("client_members")
    .select("id")
    .eq("client_id", clientId)
    .eq("user_id", userId)
    .eq("role", "staff")
    .eq("is_active", true)
    .maybeSingle();
  const { data: om } = await supabase
    .from("organization_members")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .eq("role", "staff")
    .eq("is_active", true)
    .maybeSingle();
  return !!cm || !!om;
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ clientId: string; postId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;

  const { clientId, postId } = await params;
  const supabase = await createClient();

  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("*")
    .eq("id", postId)
    .eq("client_id", clientId)
    .single();

  if (postError || !post) notFound();

  const { data: client } = await supabase
    .from("clients")
    .select("organization_id")
    .eq("id", clientId)
    .single();

  let canApprove = false;
  let approvalLogs: { id: string; step_order: number; step_name: string; action: string; comment: string | null; acted_by: string; acted_at: string; acted_by_name: string | null }[] = [];

  if (client?.organization_id && post.status === "pending_review") {
    const { data: template } = await supabase
      .from("approval_templates")
      .select("id")
      .eq("organization_id", client.organization_id)
      .eq("is_default", true)
      .limit(1)
      .maybeSingle();

    if (template) {
      const { data: steps } = await supabase
        .from("approval_steps")
        .select("id, step_order, name, required_role, assigned_to")
        .eq("template_id", template.id)
        .order("step_order", { ascending: true });
      const stepsList = steps ?? [];
      const currentStep = stepsList[Math.max(0, post.current_approval_step)];
      canApprove = await getCanCurrentUserApprove(
        supabase,
        user.id,
        user.system_role,
        clientId,
        client.organization_id,
        post.current_approval_step,
        currentStep ?? null
      );
    }
  }

  const { data: logs } = await supabase
    .from("approval_logs")
    .select("id, step_order, step_name, action, comment, acted_by, acted_at")
    .eq("post_id", postId)
    .order("acted_at", { ascending: false });

  if (logs?.length) {
    const ids = [...new Set(logs.map((l) => l.acted_by).filter(Boolean))] as string[];
    let names: Record<string, string> = {};
    if (ids.length > 0) {
      const { data: users } = await supabase.from("users").select("id, full_name").in("id", ids);
      if (users) names = Object.fromEntries(users.map((u) => [u.id, u.full_name ?? ""]));
    }
    approvalLogs = logs.map((l) => ({
      ...l,
      acted_by_name: names[l.acted_by] ?? null,
    }));
  }

  const [{ data: campaigns }, { data: clientFull }, { data: allPostIds }] =
    await Promise.all([
      supabase
        .from("campaigns")
        .select("id, name")
        .eq("client_id", clientId)
        .order("name"),
      supabase
        .from("clients")
        .select("id, name, instagram_username, tiktok_username")
        .eq("id", clientId)
        .single(),
      supabase
        .from("posts")
        .select("id")
        .eq("client_id", clientId)
        .order("scheduled_at", { ascending: true, nullsFirst: false }),
    ]);

  // 前後の投稿を特定
  const postIdList = (allPostIds ?? []).map((r) => r.id);
  const currentIndex = postIdList.indexOf(postId);
  const prevPostId = currentIndex > 0 ? postIdList[currentIndex - 1] : null;
  const nextPostId = currentIndex < postIdList.length - 1 ? postIdList[currentIndex + 1] : null;

  const p = post as Post;
  const scheduledAt = p.scheduled_at
    ? new Date(p.scheduled_at).toISOString().slice(0, 16)
    : "";

  return (
    <PostDetailWithPreview
      clientId={clientId}
      postId={postId}
      post={p}
      clientName={clientFull?.name ?? ""}
      instagramUsername={clientFull?.instagram_username ?? null}
      tiktokUsername={clientFull?.tiktok_username ?? null}
      campaigns={campaigns ?? []}
      canApprove={canApprove}
      approvalLogs={approvalLogs}
      prevPostId={prevPostId}
      nextPostId={nextPostId}
    />
  );
}

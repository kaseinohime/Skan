import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OrganizationEditForm } from "./organization-edit-form";
import { InviteMemberForm } from "./invite-member-form";
import { BillingSettingsForm } from "@/components/master/billing-settings-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function MasterOrganizationDetailPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const user = await requireRole(["master"]);
  if (!user) redirect("/login");

  const { orgId } = await params;
  const supabase = await createClient();

  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", orgId)
    .single();

  if (orgError || !org) notFound();

  const { data: members } = await supabase
    .from("organization_members")
    .select("id, role, joined_at, user_id")
    .eq("organization_id", orgId)
    .eq("is_active", true);

  const { data: invitations } = await supabase
    .from("organization_invitations")
    .select("id, email, role, created_at")
    .eq("organization_id", orgId);

  const userIds = [...new Set((members ?? []).map((m) => m.user_id))];
  const { data: usersData } =
    userIds.length > 0
      ? await supabase.from("users").select("id, email, full_name").in("id", userIds)
      : { data: [] as { id: string; email: string; full_name: string }[] };
  const usersMap = new Map(
    (usersData ?? []).map((u) => [u.id, u])
  );

  return (
    <div className="container mx-auto max-w-4xl space-y-8 p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <Button variant="ghost" size="sm" className="rounded-lg" asChild>
            <Link href="/master/organizations">← 企業一覧</Link>
          </Button>
          <h1 className="text-2xl font-bold">{org.name}</h1>
          {org.is_active ? (
            <Badge variant="secondary">有効</Badge>
          ) : (
            <Badge variant="outline">無効</Badge>
          )}
        </div>
        <Button size="sm" className="rounded-lg" asChild>
          <Link href={`/master/organizations/${orgId}/dashboard`}>
            → この組織のダッシュボード
          </Link>
        </Button>
      </div>

      <OrganizationEditForm org={org} />

      {/* 課金・制限設定 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">課金プラン・AI制限</CardTitle>
          <CardDescription>
            プランを変更すると AI 利用回数とクライアント数上限が自動で更新されます。
            「カスタム」を選択すると手動で設定できます。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BillingSettingsForm
            orgId={orgId}
            current={{
              subscription_plan: org.subscription_plan ?? "free",
              ai_window_hours: org.ai_window_hours ?? 1,
              ai_limit_per_window: org.ai_limit_per_window ?? 10,
              client_limit: org.client_limit ?? null,
            }}
          />
        </CardContent>
      </Card>

      <section>
        <h2 className="mb-4 text-lg font-semibold">ユーザーを招待</h2>
        <InviteMemberForm orgId={orgId} />
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">メンバー</h2>
        <ul className="space-y-2 rounded-md border p-4">
          {(members ?? []).length === 0 ? (
            <li className="text-muted-foreground text-sm">メンバーはいません。</li>
          ) : (
            (members ?? []).map((m) => {
              const u = usersMap.get(m.user_id);
              return (
                <li key={m.id} className="flex items-center justify-between text-sm">
                  <span>
                    {u?.full_name ?? u?.email ?? "—"}（{m.role}）
                  </span>
                </li>
              );
            })
          )}
        </ul>
      </section>

      {(invitations?.length ?? 0) > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">招待中</h2>
          <ul className="space-y-2 rounded-md border p-4">
            {invitations!.map((inv: { id: string; email: string; role: string }) => (
              <li key={inv.id} className="text-muted-foreground text-sm">
                {inv.email}（{inv.role}）— 未登録
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

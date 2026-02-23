import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { TeamMemberList } from "./team-member-list";

export const dynamic = "force-dynamic";

export default async function ClientTeamPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;

  const { clientId } = await params;
  const supabase = await createClient();

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id, name, organization_id")
    .eq("id", clientId)
    .single();

  if (clientError || !client) notFound();

  const [{ data: members }, { data: invitations }, { data: orgMembers }] = await Promise.all([
    supabase
      .from("client_members")
      .select("id, user_id, role, is_active, joined_at, users(id, email, full_name)")
      .eq("client_id", clientId)
      .order("joined_at", { nullsFirst: true }),
    supabase
      .from("client_invitations")
      .select("id, email, role, created_at")
      .eq("client_id", clientId),
    supabase
      .from("organization_members")
      .select("id, user_id, users(id, email, full_name)")
      .eq("organization_id", client.organization_id)
      .eq("is_active", true),
  ]);

  const canManage = user.system_role === "agency_admin" || user.system_role === "master";

  return (
    <div className="container mx-auto max-w-4xl space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">チーム</h1>
          <p className="text-muted-foreground">{client.name} のメンバー管理</p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/clients/${clientId}`}>ワークスペースに戻る</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            メンバー
          </CardTitle>
          <CardDescription>
            このワークスペースにアクセスできるメンバーです。スタッフは投稿の作成・編集、クライアントは承認が可能です。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TeamMemberList
            clientId={clientId}
            members={members ?? []}
            invitations={invitations ?? []}
            orgMembers={orgMembers ?? []}
            canManage={canManage}
          />
        </CardContent>
      </Card>
    </div>
  );
}

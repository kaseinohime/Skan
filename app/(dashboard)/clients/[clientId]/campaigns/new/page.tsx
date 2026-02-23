import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CampaignForm } from "../campaign-form";

export const dynamic = "force-dynamic";

export default async function NewCampaignPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;

  const { clientId } = await params;
  const supabase = await createClient();
  const { data: client, error } = await supabase
    .from("clients")
    .select("id, name")
    .eq("id", clientId)
    .single();

  if (error || !client) notFound();

  const { data: assigneeRows } = await supabase
    .from("client_assignees")
    .select("user_id, role")
    .eq("client_id", clientId);
  const defaultDirectors = (assigneeRows ?? []).filter((r) => r.role === "director").map((r) => r.user_id);
  const defaultEditors = (assigneeRows ?? []).filter((r) => r.role === "editor").map((r) => r.user_id);

  return (
    <div className="container mx-auto max-w-2xl space-y-8 p-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/clients/${clientId}/campaigns`}>← 企画一覧</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>新規企画</CardTitle>
          <CardDescription>{client.name} に企画を追加します。担当者はクライアントの設定をデフォルトで引き継ぎます</CardDescription>
        </CardHeader>
        <CardContent>
          <CampaignForm
            clientId={clientId}
            defaultDirectorIds={defaultDirectors}
            defaultEditorIds={defaultEditors}
          />
        </CardContent>
      </Card>
    </div>
  );
}

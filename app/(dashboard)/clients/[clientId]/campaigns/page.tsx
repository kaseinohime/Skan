import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus } from "lucide-react";
import type { CampaignStatus } from "@/types";

export const dynamic = "force-dynamic";

const statusLabel: Record<CampaignStatus, string> = {
  active: "進行中",
  completed: "完了",
  archived: "アーカイブ",
};

export default async function ClientCampaignsPage({
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
    .select("id, name")
    .eq("id", clientId)
    .single();

  if (clientError || !client) notFound();

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  return (
    <div className="container mx-auto max-w-4xl space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">企画</h1>
          <p className="text-muted-foreground">{client.name} の企画一覧</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/clients/${clientId}`}>ワークスペースに戻る</Link>
          </Button>
          <Button asChild>
            <Link href={`/clients/${clientId}/campaigns/new`}>
              <Plus className="mr-2 h-4 w-4" />
              新規企画
            </Link>
          </Button>
        </div>
      </div>

      {!campaigns?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">企画がまだありません</p>
            <Button asChild className="mt-4">
              <Link href={`/clients/${clientId}/campaigns/new`}>最初の企画を作成</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {campaigns.map((c) => (
            <Link key={c.id} href={`/clients/${clientId}/campaigns/${c.id}`}>
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardHeader className="pb-2">
                  <CardTitle className="line-clamp-1 text-lg">{c.name}</CardTitle>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    {c.start_date && c.end_date
                      ? `${c.start_date} 〜 ${c.end_date}`
                      : c.start_date ?? "期間未設定"}
                    <Badge variant={c.status === "active" ? "default" : "secondary"}>
                      {statusLabel[c.status as CampaignStatus]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {c.description && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {c.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

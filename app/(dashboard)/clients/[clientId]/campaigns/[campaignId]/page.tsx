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
import { CampaignForm } from "../campaign-form";
import type { Campaign, CampaignStatus } from "@/types";

export const dynamic = "force-dynamic";

const statusLabel: Record<CampaignStatus, string> = {
  active: "進行中",
  completed: "完了",
  archived: "アーカイブ",
};

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ clientId: string; campaignId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;

  const { clientId, campaignId } = await params;
  const supabase = await createClient();

  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", campaignId)
    .eq("client_id", clientId)
    .single();

  if (campaignError || !campaign) notFound();

  const { data: client } = await supabase
    .from("clients")
    .select("name")
    .eq("id", clientId)
    .single();

  const { data: posts } = await supabase
    .from("posts")
    .select("id, title, status, scheduled_at")
    .eq("campaign_id", campaignId)
    .order("scheduled_at", { ascending: true, nullsFirst: false });

  const c = campaign as Campaign;

  return (
    <div className="container mx-auto max-w-4xl space-y-8 p-8">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/clients/${clientId}/campaigns`}>← 企画一覧</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/clients/${clientId}/calendar`}>カレンダー</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {c.name}
            <Badge variant={c.status === "active" ? "default" : "secondary"}>
              {statusLabel[c.status]}
            </Badge>
          </CardTitle>
          <CardDescription>
            {c.start_date && c.end_date
              ? `${c.start_date} 〜 ${c.end_date}`
              : "期間未設定"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <CampaignForm
            clientId={clientId}
            campaignId={campaignId}
            defaultValues={{
              name: c.name,
              description: c.description ?? "",
              start_date: c.start_date ?? "",
              end_date: c.end_date ?? "",
              status: c.status,
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>紐付く投稿</CardTitle>
          <CardDescription>
            この企画に紐づいている投稿です
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!posts?.length ? (
            <p className="text-muted-foreground text-sm">投稿はまだありません</p>
          ) : (
            <ul className="space-y-2">
              {posts.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/clients/${clientId}/posts/${p.id}`}
                    className="flex items-center justify-between rounded-md border p-3 transition-colors hover:bg-muted/50"
                  >
                    <span className="font-medium">{p.title}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{p.status}</Badge>
                      {p.scheduled_at && (
                        <span className="text-muted-foreground text-sm">
                          {new Date(p.scheduled_at).toLocaleString("ja")}
                        </span>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Button className="mt-4" asChild>
            <Link href={`/clients/${clientId}/posts/new?campaign_id=${campaignId}`}>
              投稿を追加
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

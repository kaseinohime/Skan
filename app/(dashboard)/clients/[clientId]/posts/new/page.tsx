import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PostForm } from "../post-form";

export const dynamic = "force-dynamic";

export default async function NewPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;

  const { clientId } = await params;
  const q = await searchParams;
  const campaignId = q.campaign_id ?? null;

  const supabase = await createClient();
  const { data: client, error } = await supabase
    .from("clients")
    .select("id, name")
    .eq("id", clientId)
    .single();

  if (error || !client) notFound();

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, name")
    .eq("client_id", clientId)
    .eq("status", "active")
    .order("name");

  return (
    <div className="container mx-auto max-w-2xl space-y-8 p-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/clients/${clientId}/posts`}>投稿一覧へ</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>新規投稿</CardTitle>
          <CardDescription>{client.name} に投稿を追加します</CardDescription>
        </CardHeader>
        <CardContent>
          <PostForm
            clientId={clientId}
            campaigns={campaigns ?? []}
            defaultCampaignId={campaignId}
          />
        </CardContent>
      </Card>
    </div>
  );
}

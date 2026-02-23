import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ClientWorkspacePage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  const { clientId } = await params;
  const supabase = await createClient();
  const { data: client, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .single();

  if (error || !client) {
    notFound();
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{client.name}</h1>
          <p className="text-muted-foreground">
            {client.slug}
            {client.instagram_username && ` • @${client.instagram_username}`}
            {client.tiktok_username && ` • @${client.tiktok_username}`}
          </p>
        </div>
        {(user.system_role === "agency_admin" || user.system_role === "master") && (
          <Button variant="outline" asChild>
            <Link href={`/clients/${clientId}/edit`}>編集</Link>
          </Button>
        )}
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            ワークスペース
          </CardTitle>
          <CardDescription>
            このクライアントの投稿・企画・チームは今後ここから管理します
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {client.description && (
            <p className="text-muted-foreground">{client.description}</p>
          )}
          <div className="flex flex-wrap gap-3 pt-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/clients/${clientId}/campaigns`}>企画</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/clients/${clientId}/posts`}>投稿一覧</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/clients/${clientId}/calendar`}>カレンダー</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/clients/${clientId}/team`}>チーム</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

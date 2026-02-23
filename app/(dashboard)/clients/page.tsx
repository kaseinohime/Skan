import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Building2, Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ClientsListPage() {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  const supabase = await createClient();
  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .order("name");

  return (
    <div className="container mx-auto max-w-5xl space-y-8 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">クライアント一覧</h1>
        {(user.system_role === "agency_admin" || user.system_role === "master") && (
          <Button asChild>
            <Link href="/clients/new">
              <Plus className="mr-2 h-4 w-4" />
              新規作成
            </Link>
          </Button>
        )}
      </div>
      {!clients?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">クライアントがまだありません</p>
            {(user.system_role === "agency_admin" || user.system_role === "master") && (
              <Button asChild className="mt-4">
                <Link href="/clients/new">最初のクライアントを作成</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <Link key={client.id} href={`/clients/${client.id}`}>
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardHeader className="pb-2">
                  <CardTitle className="line-clamp-1 text-lg">{client.name}</CardTitle>
                  <CardDescription className="line-clamp-1">
                    {client.slug}
                    {client.instagram_username && ` • @${client.instagram_username}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {client.description && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {client.description}
                    </p>
                  )}
                  {!client.is_active && (
                    <span className="text-xs text-muted-foreground">（無効）</span>
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

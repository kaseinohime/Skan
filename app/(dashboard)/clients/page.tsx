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
import { Building2, Plus, ArrowRight } from "lucide-react";

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

  const canCreate =
    user.system_role === "agency_admin" || user.system_role === "master";

  return (
    <div className="container mx-auto max-w-5xl space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">クライアント一覧</h1>
          <p className="text-muted-foreground mt-1">
            ワークスペース（クライアント）の管理
          </p>
        </div>
        {canCreate && (
          <Button asChild className="rounded-lg">
            <Link href="/clients/new">
              <Plus className="mr-2 h-4 w-4" />
              クライアントを作成
            </Link>
          </Button>
        )}
      </div>

      {!clients?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">クライアントがまだありません</p>
            {canCreate && (
              <Button asChild className="mt-4 rounded-lg">
                <Link href="/clients/new">最初のクライアントを作成</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <Card key={client.id} className="flex flex-col transition-shadow hover:shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 text-primary">
                  <Building2 className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">{client.name}</CardTitle>
                <CardDescription className="line-clamp-1">
                  {client.slug}
                  {client.instagram_username && ` • @${client.instagram_username}`}
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto space-y-2 pt-0">
                {client.description && (
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {client.description}
                  </p>
                )}
                {!client.is_active && (
                  <span className="text-xs text-muted-foreground">（無効）</span>
                )}
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button variant="outline" size="sm" className="rounded-lg" asChild>
                    <Link href={`/clients/${client.id}`}>
                      詳細を見る <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                  <Button size="sm" className="rounded-lg" asChild>
                    <Link href={`/clients/${client.id}`}>
                      → このクライアントに入る
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

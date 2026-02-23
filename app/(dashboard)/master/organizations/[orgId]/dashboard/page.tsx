import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Building2, LayoutDashboard, Users, ArrowRight, Settings } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MasterOrganizationDashboardPage({
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
    .select("id, name, slug")
    .eq("id", orgId)
    .single();

  if (orgError || !org) notFound();

  const [
    { count: clientCount },
    { count: memberCount },
    { data: clients },
  ] = await Promise.all([
    supabase
      .from("clients")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId),
    supabase
      .from("organization_members")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("is_active", true),
    supabase
      .from("clients")
      .select("id, name, slug, description")
      .eq("organization_id", orgId)
      .order("name"),
  ]);

  return (
    <div className="container mx-auto max-w-5xl space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{org.name}</h1>
          <p className="text-muted-foreground mt-1">{org.name} の稼働状況</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-lg" asChild>
            <Link href={`/master/organizations/${orgId}`}>
              <Settings className="mr-1.5 h-4 w-4" />
              組織設定
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="rounded-lg" asChild>
            <Link href="/master/organizations">← 組織一覧</Link>
          </Button>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-primary">
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <CardTitle className="text-base font-medium text-muted-foreground">
              クライアント数
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-2xl font-bold">{clientCount ?? 0}件</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-primary">
              <Users className="h-5 w-5" />
            </div>
            <CardTitle className="text-base font-medium text-muted-foreground">
              スタッフ数
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-2xl font-bold">{memberCount ?? 0}名</p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">クライアント一覧</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/clients/new">+ クライアントを追加</Link>
          </Button>
        </div>
        {!clients?.length ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">この組織にクライアントがまだありません</p>
              <Button asChild className="mt-4 rounded-lg">
                <Link href="/clients/new">クライアントを作成</Link>
              </Button>
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
                  <CardDescription className="line-clamp-1">{client.slug}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto flex flex-col gap-2 pt-0">
                  {client.description && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {client.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1 rounded-lg" asChild>
                      <Link href={`/clients/${client.id}`}>
                        詳細を見る <ArrowRight className="ml-1 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                    <Button size="sm" className="flex-1 rounded-lg" asChild>
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
      </section>
    </div>
  );
}

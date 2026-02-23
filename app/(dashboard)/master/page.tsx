import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Building2, Users, LayoutDashboard, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MasterDashboardPage() {
  const user = await requireRole(["master"]);
  if (!user) redirect("/login");

  const supabase = await createClient();
  const [
    { count: orgCount },
    { count: clientCount },
    { count: userCount },
  ] = await Promise.all([
    supabase.from("organizations").select("id", { count: "exact", head: true }),
    supabase.from("clients").select("id", { count: "exact", head: true }),
    supabase.from("users").select("id", { count: "exact", head: true }),
  ]);

  const { data: organizations } = await supabase
    .from("organizations")
    .select("id, name, slug")
    .order("name")
    .limit(12);

  return (
    <div className="container mx-auto max-w-5xl space-y-8 p-8">
      <div>
        <h1 className="text-2xl font-bold">マスターダッシュボード</h1>
        <p className="text-muted-foreground mt-1">全組織の稼働状況</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-primary">
              <Building2 className="h-5 w-5" />
            </div>
            <CardTitle className="text-base font-medium text-muted-foreground">
              登録組織数
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-2xl font-bold">{orgCount ?? 0}組織</p>
          </CardContent>
        </Card>
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
              総アカウント数
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-2xl font-bold">{userCount ?? 0}名</p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">組織別ステータス</h2>
        {!organizations?.length ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">組織がまだありません</p>
              <Button asChild className="mt-4 rounded-lg">
                <Link href="/master/organizations/new">組織を作成</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {organizations.map((org) => (
              <Card key={org.id} className="flex flex-col transition-shadow hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 text-primary">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">{org.name}</CardTitle>
                  <CardDescription>{org.slug}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto flex flex-col gap-2 pt-0">
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" className="flex-1 rounded-lg" asChild>
                      <Link href={`/master/organizations/${org.id}`}>
                        詳細を見る <ArrowRight className="ml-1 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                    <Button size="sm" className="flex-1 rounded-lg" asChild>
                      <Link href={`/master/organizations/${org.id}`}>
                        → この組織に入る
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        {organizations && organizations.length > 0 && (
          <Button variant="ghost" size="sm" asChild>
            <Link href="/master/organizations">組織一覧へ →</Link>
          </Button>
        )}
      </section>
    </div>
  );
}

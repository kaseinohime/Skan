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
import { Building2, Plus, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MasterOrganizationsPage() {
  const user = await requireRole(["master"]);
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: organizations } = await supabase
    .from("organizations")
    .select("id, name, slug, description, is_active")
    .order("name");

  return (
    <div className="container mx-auto max-w-5xl space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">組織管理</h1>
          <p className="text-muted-foreground mt-1">全組織の管理を行います</p>
        </div>
        <Button asChild className="rounded-lg">
          <Link href="/master/organizations/new">
            <Plus className="mr-2 h-4 w-4" />
            組織を作成
          </Link>
        </Button>
      </div>

      {!organizations?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">組織がまだありません</p>
            <Button asChild className="mt-4 rounded-lg">
              <Link href="/master/organizations/new">最初の組織を作成</Link>
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
                <CardDescription>
                  {org.slug}
                  {!org.is_active && " • 無効"}
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto space-y-2 pt-0">
                {org.description && (
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {org.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button variant="outline" size="sm" className="rounded-lg" asChild>
                    <Link href={`/master/organizations/${org.id}`}>
                      詳細・設定 <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                  <Button size="sm" className="rounded-lg" asChild>
                    <Link href={`/master/organizations/${org.id}/dashboard`}>
                      → この組織に入る
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

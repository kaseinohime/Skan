import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Plus } from "lucide-react";
import { OrganizationList } from "./organization-list";

export const dynamic = "force-dynamic";

export default async function MasterOrganizationsPage() {
  const user = await requireRole(["master"]);
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: organizations } = await supabase
    .from("organizations")
    .select("id, name, slug, description, is_active, created_at")
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
        <OrganizationList organizations={organizations} />
      )}
    </div>
  );
}

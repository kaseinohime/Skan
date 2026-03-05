import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Building2, Plus } from "lucide-react";
import { OrganizationList } from "./organization-list";

export const dynamic = "force-dynamic";

export default async function MasterOrganizationsPage() {
  const user = await requireRole(["master"]);
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: organizations } = await supabase
    .from("organizations")
    .select("id, name, slug, description, is_active, created_at, subscription_plan, subscription_status, current_period_end, stripe_customer_id")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground">組織管理</h1>
          <p className="mt-1 text-sm text-muted-foreground">全組織のプラン・メンバー・設定を管理します</p>
        </div>
        <Button asChild className="rounded-xl">
          <Link href="/master/organizations/new">
            <Plus className="mr-2 h-4 w-4" />
            組織を作成
          </Link>
        </Button>
      </div>

      {!organizations?.length ? (
        <div className="rounded-2xl border border-border/60 bg-white/60 py-16 text-center">
          <Building2 className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">組織がまだありません</p>
          <Button asChild className="rounded-xl">
            <Link href="/master/organizations/new">最初の組織を作成</Link>
          </Button>
        </div>
      ) : (
        <OrganizationList organizations={organizations} />
      )}
    </div>
  );
}

import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { OrganizationList } from "./organization-list";

export const dynamic = "force-dynamic";

export default async function MasterOrganizationsPage() {
  const user = await requireRole(["master"]);
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: organizations } = await supabase
    .from("organizations")
    .select("id, name, slug, description, is_active, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="container mx-auto max-w-4xl space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/master">← マスター</Link>
          </Button>
          <h1 className="text-2xl font-bold">企業一覧</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href="/master/organizations/new">企業を追加</Link>
          </Button>
          <SignOutButton />
        </div>
      </div>

      <OrganizationList organizations={organizations ?? []} />
    </div>
  );
}

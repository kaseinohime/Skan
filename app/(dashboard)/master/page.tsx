import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/auth/sign-out-button";

export const dynamic = "force-dynamic";

export default async function MasterDashboardPage() {
  const user = await requireRole(["master"]);
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { count: orgCount } = await supabase
    .from("organizations")
    .select("id", { count: "exact", head: true });

  return (
    <div className="container mx-auto max-w-4xl space-y-8 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">マスターダッシュボード</h1>
        <SignOutButton />
      </div>
      <p className="text-muted-foreground">
        全企業を管理するマスター画面です。
      </p>
      <div className="flex flex-wrap gap-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-muted-foreground text-sm">企業数</p>
          <p className="text-2xl font-bold">{orgCount ?? 0}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-4">
        <Button asChild>
          <Link href="/master/organizations">企業一覧</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/master/users">ユーザー一覧・ロール設定</Link>
        </Button>
      </div>
    </div>
  );
}

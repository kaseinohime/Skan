import { requireRole } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";

export default async function MasterDashboardPage() {
  const user = await requireRole(["master"]);
  if (!user) redirect("/login");

  return (
    <div className="container mx-auto max-w-4xl space-y-8 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">マスターダッシュボード</h1>
        <SignOutButton />
      </div>
      <p className="text-muted-foreground">
        全企業を管理するマスター画面です。
      </p>
      <Button asChild>
        <Link href="/master/organizations">企業一覧</Link>
      </Button>
    </div>
  );
}

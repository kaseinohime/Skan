import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/auth/sign-out-button";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-8 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ダッシュボード</h1>
        <SignOutButton />
      </div>
      <p className="text-muted-foreground">
        {user.full_name}（{user.email}）としてログイン中です。
      </p>
      {user.system_role === "agency_admin" && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">クライアント管理</h2>
          <Button asChild>
            <Link href="/clients">クライアント一覧</Link>
          </Button>
        </section>
      )}
      {user.system_role === "master" && (
        <Button asChild>
          <Link href="/master">マスター画面へ</Link>
        </Button>
      )}
    </div>
  );
}

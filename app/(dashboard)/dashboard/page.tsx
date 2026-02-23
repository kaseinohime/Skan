import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SignOutButton } from "@/components/auth/sign-out-button";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="container mx-auto max-w-md space-y-8 p-8">
        <h1 className="text-2xl font-bold">ダッシュボード</h1>
        <Card>
          <CardHeader>
            <CardTitle>ユーザー情報を取得できません</CardTitle>
            <CardDescription>
              ログインは有効ですが、アカウント情報の取得に失敗しました。
              招待リンクから初めて登録した場合は、一度ログアウトしてから再度ログインしてみてください。
              それでも表示されない場合は管理者にお問い合わせください。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignOutButton />
          </CardContent>
        </Card>
      </div>
    );
  }

  let clientCount = 0;
  if (user.system_role === "agency_admin" || user.system_role === "staff") {
    const supabase = await createClient();
    const { count } = await supabase
      .from("clients")
      .select("id", { count: "exact", head: true });
    clientCount = count ?? 0;
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-8 p-8">
      <h1 className="text-2xl font-bold">ダッシュボード</h1>
      <p className="text-muted-foreground">
        {user.full_name}（{user.email}）としてログイン中です。
      </p>
      {(user.system_role === "agency_admin" || user.system_role === "staff") && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">クライアント</h2>
          <p className="text-muted-foreground">
            管理中のクライアント: <strong>{clientCount}</strong> 件
          </p>
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

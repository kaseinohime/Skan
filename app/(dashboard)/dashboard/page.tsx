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
import { Building2, LayoutDashboard, ArrowRight, FileText, UserCheck } from "lucide-react";

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

  const supabase = await createClient();
  let clientCount = 0;
  let clients: { id: string; name: string }[] = [];
  let assignedClients: { id: string; name: string }[] = [];
  let assignedPosts: { id: string; title: string; status: string; client_id: string }[] = [];
  let clientNames: Record<string, string> = {};

  if (user.system_role === "agency_admin" || user.system_role === "staff") {
    const [
      { data: clientsData, count },
      { data: clientAssigneeRows },
      { data: postAssigneeRows },
    ] = await Promise.all([
      supabase
        .from("clients")
        .select("id, name", { count: "exact" })
        .order("name")
        .limit(12),
      supabase
        .from("client_assignees")
        .select("client_id")
        .eq("user_id", user.id),
      supabase
        .from("post_assignees")
        .select("post_id")
        .eq("user_id", user.id),
    ]);
    clientCount = count ?? 0;
    clients = clientsData ?? [];
    const assignedClientIds = [...new Set((clientAssigneeRows ?? []).map((r) => r.client_id))];
    const assignedPostIds = (postAssigneeRows ?? []).map((r) => r.post_id);
    let assignedClients: { id: string; name: string }[] = [];
    let assignedPosts: { id: string; title: string; status: string; client_id: string }[] = [];
    if (assignedClientIds.length > 0) {
      const { data: cList } = await supabase
        .from("clients")
        .select("id, name")
        .in("id", assignedClientIds)
        .order("name");
      assignedClients = cList ?? [];
    }
    if (assignedPostIds.length > 0) {
      const { data: pList } = await supabase
        .from("posts")
        .select("id, title, status, client_id")
        .in("id", assignedPostIds)
        .order("updated_at", { ascending: false })
        .limit(10);
      assignedPosts = pList ?? [];
      const ids = [...new Set(assignedPosts.map((p) => p.client_id))];
      const { data: cList2 } = await supabase.from("clients").select("id, name").in("id", ids);
      clientNames = Object.fromEntries((cList2 ?? []).map((c) => [c.id, c.name]));
    }
  }

  return (
    <div className="container mx-auto max-w-5xl space-y-8 p-8">
      <div>
        <h1 className="text-2xl font-bold">ダッシュボード</h1>
        <p className="text-muted-foreground mt-1">
          {user.system_role === "master"
            ? "全組織の稼働状況"
            : `${user.full_name} の稼働状況`}
        </p>
      </div>

      {(user.system_role === "agency_admin" || user.system_role === "staff") && (
        <>
          {(assignedClients.length > 0 || assignedPosts.length > 0) && (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" />
                担当分
              </h2>
              <p className="text-muted-foreground text-sm">
                自分が担当者に設定されているクライアント・投稿です
              </p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {assignedClients.map((c) => (
                  <Card key={c.id} className="flex flex-col border-primary/20 bg-primary/5">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2 text-primary">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-lg">担当クライアント: {c.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="mt-auto pt-0">
                      <Button size="sm" className="rounded-lg w-full" asChild>
                        <Link href={`/clients/${c.id}`}>
                          → 開く <ArrowRight className="ml-1 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
                {assignedPosts.map((p) => (
                  <Card key={p.id} className="flex flex-col border-primary/20 bg-primary/5">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2 text-primary">
                        <FileText className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-lg line-clamp-1">{p.title}</CardTitle>
                      <CardDescription>
                        {clientNames[p.client_id] ?? "—"} · {p.status}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="mt-auto pt-0">
                      <Button size="sm" className="rounded-lg w-full" asChild>
                        <Link href={`/clients/${p.client_id}/posts/${p.id}`}>
                          → 開く <ArrowRight className="ml-1 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 text-primary">
                  <Building2 className="h-5 w-5" />
                </div>
                <CardTitle className="text-base font-medium text-muted-foreground">
                  管理中のクライアント
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-2xl font-bold">{clientCount}件</p>
              </CardContent>
            </Card>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">クライアント一覧</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/clients">クライアント一覧へ →</Link>
              </Button>
            </div>
            {clients.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Building2 className="mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">クライアントがまだありません</p>
                  <Button asChild className="mt-4">
                    <Link href="/clients/new">最初のクライアントを作成</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {clients.map((client) => (
                  <Card key={client.id} className="flex flex-col">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2 text-primary">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-lg">{client.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="mt-auto flex flex-col gap-2 pt-0">
                      <div className="flex flex-wrap gap-2">
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
        </>
      )}

      {user.system_role === "master" && (
        <section className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-primary">
                <LayoutDashboard className="h-5 w-5" />
              </div>
              <CardTitle className="text-base font-medium text-muted-foreground">
                マスター管理
              </CardTitle>
              <CardDescription>全企業・ユーザーを管理します</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="rounded-lg">
                <Link href="/master">
                  マスター画面へ <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}

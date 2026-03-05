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
import { Badge } from "@/components/ui/badge";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Building2, LayoutDashboard, ArrowRight, FileText, UserCheck, FileCheck, CalendarClock, RotateCcw } from "lucide-react";
import type { PostStatus } from "@/types";

export const dynamic = "force-dynamic";

const statusLabel: Record<PostStatus, string> = {
  draft: "下書き",
  in_progress: "作成中",
  pending_review: "承認待ち",
  revision: "差し戻し",
  approved: "承認済み",
  scheduled: "予約済み",
  published: "公開済み",
};

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
  let pendingApprovalCount = 0;
  let upcomingPosts: { id: string; title: string; scheduled_at: string; client_id: string }[] = [];
  let revisionPosts: { id: string; title: string; client_id: string }[] = [];
  let upcomingClientNames: Record<string, string> = {};

  if (user.system_role === "agency_admin" || user.system_role === "staff") {
    const [
      { data: clientsData, count },
      { data: clientAssigneeRows },
      { data: postAssigneeRows },
      { count: pendingCount },
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
      supabase
        .from("posts")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending_review"),
    ]);
    clientCount = count ?? 0;
    clients = clientsData ?? [];
    pendingApprovalCount = pendingCount ?? 0;

    // 今日・明日の公開予定投稿
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const dayAfterTomorrow = new Date(todayStart);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

    const [
      { data: upcomingData },
      { data: revisionData },
    ] = await Promise.all([
      supabase
        .from("posts")
        .select("id, title, scheduled_at, client_id")
        .gte("scheduled_at", todayStart.toISOString())
        .lt("scheduled_at", dayAfterTomorrow.toISOString())
        .order("scheduled_at", { ascending: true })
        .limit(10),
      supabase
        .from("posts")
        .select("id, title, client_id")
        .eq("status", "revision")
        .order("updated_at", { ascending: false })
        .limit(5),
    ]);

    upcomingPosts = upcomingData ?? [];
    revisionPosts = revisionData ?? [];

    // クライアント名を取得
    const allClientIds = [
      ...new Set([
        ...upcomingPosts.map((p) => p.client_id),
        ...revisionPosts.map((p) => p.client_id),
      ]),
    ];
    if (allClientIds.length > 0) {
      const { data: cList } = await supabase
        .from("clients")
        .select("id, name")
        .in("id", allClientIds);
      upcomingClientNames = Object.fromEntries((cList ?? []).map((c) => [c.id, c.name]));
    }

    const assignedClientIds = [...new Set((clientAssigneeRows ?? []).map((r) => r.client_id))];
    const assignedPostIds = (postAssigneeRows ?? []).map((r) => r.post_id);
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
          {/* サマリーカード */}
          <section className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  管理中のクライアント
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-2xl font-bold">{clientCount}</p>
              </CardContent>
            </Card>

            <Card className={pendingApprovalCount > 0 ? "border-amber-400" : ""}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <FileCheck className="h-4 w-4" />
                  承認待ち（全体）
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className={`text-2xl font-bold ${pendingApprovalCount > 0 ? "text-amber-600" : ""}`}>
                  {pendingApprovalCount}
                </p>
                {pendingApprovalCount > 0 && (
                  <Link
                    href="/approval"
                    className="text-xs text-amber-600 hover:underline mt-1 inline-block"
                  >
                    承認待ち一覧を見る →
                  </Link>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  担当アサイン
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-2xl font-bold">
                  {assignedClients.length + assignedPosts.length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  クライアント {assignedClients.length} / 投稿 {assignedPosts.length}
                </p>
              </CardContent>
            </Card>
          </section>

          {/* 今日・明日の公開予定 */}
          {upcomingPosts.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-primary" />
                今日・明日の公開予定
              </h2>
              <Card>
                <CardContent className="divide-y pt-0 pb-0">
                  {upcomingPosts.map((p) => {
                    const dt = new Date(p.scheduled_at);
                    const isToday = dt.toDateString() === new Date().toDateString();
                    return (
                      <div key={p.id} className="flex items-center justify-between py-3 first:pt-4 last:pb-4">
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/clients/${p.client_id}/posts/${p.id}`}
                            className="font-medium hover:underline truncate block"
                          >
                            {p.title}
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {upcomingClientNames[p.client_id] ?? "—"} •{" "}
                            <span className={isToday ? "text-amber-600 font-medium" : ""}>
                              {isToday ? "今日" : "明日"} {dt.toLocaleTimeString("ja", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </p>
                        </div>
                        <Button size="sm" variant="outline" asChild className="ml-3 shrink-0">
                          <Link href={`/clients/${p.client_id}/posts/${p.id}`}>
                            確認 <ArrowRight className="ml-1 h-3 w-3" />
                          </Link>
                        </Button>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </section>
          )}

          {/* 差し戻し中 */}
          {revisionPosts.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-amber-500" />
                差し戻し中の投稿
                <span className="text-base font-normal text-amber-600">（{revisionPosts.length}件）</span>
              </h2>
              <Card className="border-amber-300">
                <CardContent className="divide-y pt-0 pb-0">
                  {revisionPosts.map((p) => (
                    <div key={p.id} className="flex items-center justify-between py-3 first:pt-4 last:pb-4">
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/clients/${p.client_id}/posts/${p.id}`}
                          className="font-medium hover:underline truncate block text-amber-800"
                        >
                          {p.title}
                        </Link>
                        <p className="text-xs text-muted-foreground">{upcomingClientNames[p.client_id] ?? "—"}</p>
                      </div>
                      <Button size="sm" variant="outline" asChild className="ml-3 shrink-0 border-amber-300 text-amber-700 hover:bg-amber-50">
                        <Link href={`/clients/${p.client_id}/posts/${p.id}`}>
                          修正する <ArrowRight className="ml-1 h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </section>
          )}

          {/* 担当分 */}
          {(assignedClients.length > 0 || assignedPosts.length > 0) && (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" />
                担当分
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {assignedClients.map((c) => (
                  <Card key={c.id} className="flex flex-col border-primary/20 bg-primary/5">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2 text-primary">
                        <Building2 className="h-4 w-4" />
                        <span className="text-xs font-medium">担当クライアント</span>
                      </div>
                      <CardTitle className="text-base">{c.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="mt-auto pt-0">
                      <Button size="sm" className="rounded-lg w-full" asChild>
                        <Link href={`/clients/${c.id}`}>
                          ワークスペースを開く <ArrowRight className="ml-1 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
                {assignedPosts.map((p) => (
                  <Card key={p.id} className="flex flex-col border-primary/20 bg-primary/5">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2 text-primary">
                        <FileText className="h-4 w-4" />
                        <span className="text-xs font-medium">{clientNames[p.client_id] ?? "—"}</span>
                      </div>
                      <CardTitle className="text-base line-clamp-1">{p.title}</CardTitle>
                      <Badge variant="outline" className="w-fit text-xs">
                        {statusLabel[p.status as PostStatus] ?? p.status}
                      </Badge>
                    </CardHeader>
                    <CardContent className="mt-auto pt-0">
                      <Button size="sm" className="rounded-lg w-full" asChild>
                        <Link href={`/clients/${p.client_id}/posts/${p.id}`}>
                          投稿を開く <ArrowRight className="ml-1 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* クライアント一覧 */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">クライアント一覧</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/clients">すべて見る →</Link>
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
                  <Card key={client.id} className="flex flex-col hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2 text-primary">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <CardTitle className="text-base">{client.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="mt-auto pt-0">
                      <Button variant="outline" size="sm" className="rounded-lg w-full" asChild>
                        <Link href={`/clients/${client.id}`}>
                          ワークスペースを開く <ArrowRight className="ml-1 h-3.5 w-3.5" />
                        </Link>
                      </Button>
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

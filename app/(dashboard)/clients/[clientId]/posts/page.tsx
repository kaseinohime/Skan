import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, Plus } from "lucide-react";
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

export default async function ClientPostsPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;

  const { clientId } = await params;
  const supabase = await createClient();

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id, name")
    .eq("id", clientId)
    .single();

  if (clientError || !client) notFound();

  const { data: posts } = await supabase
    .from("posts")
    .select("id, title, status, post_type, platform, scheduled_at, campaign_id")
    .eq("client_id", clientId)
    .order("scheduled_at", { ascending: true, nullsFirst: false });

  return (
    <div className="container mx-auto max-w-5xl space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">投稿一覧</h1>
          <p className="text-muted-foreground">{client.name} の投稿</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/clients/${clientId}`}>ワークスペースに戻る</Link>
          </Button>
          <Button asChild>
            <Link href={`/clients/${clientId}/posts/new`}>
              <Plus className="mr-2 h-4 w-4" />
              新規投稿
            </Link>
          </Button>
        </div>
      </div>

      {!posts?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">投稿がまだありません</p>
            <Button asChild className="mt-4">
              <Link href={`/clients/${clientId}/posts/new`}>最初の投稿を作成</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>投稿</CardTitle>
            <CardDescription>テーブル形式で一覧表示しています</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>タイトル</TableHead>
                  <TableHead>種別</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead>予定日時</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/clients/${clientId}/posts/${p.id}`}
                        className="hover:underline"
                      >
                        {p.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.platform} / {p.post_type}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{statusLabel[p.status as PostStatus]}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {p.scheduled_at
                        ? new Date(p.scheduled_at).toLocaleString("ja")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/clients/${clientId}/posts/${p.id}`}>詳細</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

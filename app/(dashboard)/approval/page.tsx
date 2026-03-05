import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileCheck } from "lucide-react";
import { getPendingApprovalPosts } from "@/lib/approval";

export const dynamic = "force-dynamic";

export default async function ApprovalPendingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const posts = await getPendingApprovalPosts(supabase, user);

  return (
    <div className="container mx-auto max-w-4xl space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">承認待ち一覧</h1>
          <p className="text-muted-foreground">
            自分が承認すべき投稿の一覧です。
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard">ダッシュボードに戻る</Link>
        </Button>
      </div>

      {posts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileCheck className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">承認待ちの投稿はありません</p>
            <Button asChild className="mt-4" variant="outline">
              <Link href="/dashboard">ダッシュボードへ</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>承認する投稿</CardTitle>
            <CardDescription>{posts.length} 件の投稿が承認待ちです</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>タイトル</TableHead>
                  <TableHead>クライアント</TableHead>
                  <TableHead>予定日時</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.title}</TableCell>
                    <TableCell className="text-muted-foreground">{p.client_name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {p.scheduled_at
                        ? new Date(p.scheduled_at).toLocaleString("ja")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/clients/${p.client_id}/posts/${p.id}`}>
                          確認・承認
                        </Link>
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

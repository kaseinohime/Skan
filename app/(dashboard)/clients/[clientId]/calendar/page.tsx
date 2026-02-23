import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarView } from "./calendar-view";

export const dynamic = "force-dynamic";

export default async function ClientCalendarPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;

  const { clientId } = await params;
  const supabase = await createClient();

  const { data: client, error } = await supabase
    .from("clients")
    .select("id, name")
    .eq("id", clientId)
    .single();

  if (error || !client) notFound();

  return (
    <div className="container mx-auto max-w-6xl space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">カレンダー</h1>
          <p className="text-muted-foreground">{client.name} の投稿予定</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/clients/${clientId}`}>ワークスペースに戻る</Link>
          </Button>
          <Button asChild>
            <Link href={`/clients/${clientId}/posts/new`}>新規投稿</Link>
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>投稿カレンダー</CardTitle>
          <CardDescription>
            ドラッグ＆ドロップで日付を変更できます。月/週表示を切り替えられます。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CalendarView clientId={clientId} />
        </CardContent>
      </Card>
    </div>
  );
}

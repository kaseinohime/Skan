import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileDown } from "lucide-react";
import { ReportConfigForm } from "./report-config-form";

export const dynamic = "force-dynamic";

export default async function ReportPage({
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
    <div className="container mx-auto max-w-3xl space-y-6 p-8">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/clients/${clientId}`}>← ワークスペース</Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <FileDown className="h-5 w-5 text-primary" />
              月次レポート生成
            </h1>
            <p className="text-sm text-muted-foreground">{client.name}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/clients/${clientId}/insights`}>
            インサイスダッシュボード
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">レポート設定</CardTitle>
          <CardDescription>
            対象月を選択し、コメントを入力してPDFを生成します。
            インサイスが入力されている投稿のデータが含まれます。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReportConfigForm clientId={clientId} clientName={client.name} />
        </CardContent>
      </Card>
    </div>
  );
}

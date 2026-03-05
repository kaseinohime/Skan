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
import { FileDown, Lock } from "lucide-react";
import { ReportConfigForm } from "./report-config-form";
import { PLAN_LIMITS, type Plan } from "@/lib/plans";

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
    .select("id, name, organization_id")
    .eq("id", clientId)
    .single();

  if (error || !client) notFound();

  // プラン制限チェック（monthlyReport）
  const { data: orgData } = await supabase
    .from("organizations")
    .select("subscription_plan")
    .eq("id", client.organization_id)
    .single();
  const plan = ((orgData?.subscription_plan ?? "free") as Plan);
  const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
  const planBlocked = !limits.monthlyReport;

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
            インサイトダッシュボード
          </Link>
        </Button>
      </div>

      {planBlocked ? (
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <Lock className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="font-semibold text-foreground">月次レポートはStandard以上のプランで利用できます</p>
            <p className="text-sm text-muted-foreground">
              現在のプラン（{plan}）ではこの機能をご利用いただけません。
            </p>
            <Button asChild className="rounded-xl">
              <Link href="/settings/billing">プランをアップグレード</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">レポート設定</CardTitle>
            <CardDescription>
              対象月を選択し、コメントを入力してPDFを生成します。
              インサイトが入力されている投稿のデータが含まれます。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ReportConfigForm clientId={clientId} clientName={client.name} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

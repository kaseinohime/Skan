import { getCurrentUser } from "@/lib/auth";
import { getCurrentUserAgencyOrganizationId } from "@/lib/organization";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Lock } from "lucide-react";
import { ApprovalFlowEditor } from "./approval-flow-editor";
import { PLAN_LIMITS, type Plan } from "@/lib/plans";

export const dynamic = "force-dynamic";

export default async function SettingsApprovalFlowPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const orgId = await getCurrentUserAgencyOrganizationId();
  if (!orgId) {
    return (
      <div className="container mx-auto max-w-3xl space-y-8 p-8">
        <h1 className="text-2xl font-bold">承認フロー設定</h1>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {user.system_role === "master" ? (
              <>
                マスターの場合は企業詳細から設定してください。
                <br />
                <Link href="/master/organizations" className="text-primary underline">
                  企業一覧へ
                </Link>
              </>
            ) : (
              "企業に所属していないため、承認フローを設定できません。"
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // プラン制限チェック（masterはスキップ）
  let planBlocked = false;
  let plan: Plan = "free";
  if (user.system_role !== "master") {
    const supabase = await createClient();
    const { data: orgData } = await supabase
      .from("organizations")
      .select("subscription_plan")
      .eq("id", orgId)
      .single();
    plan = ((orgData?.subscription_plan ?? "free") as Plan);
    const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
    planBlocked = !limits.approvalFlowCustom;
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">承認フロー設定</h1>
          <p className="text-muted-foreground">
            投稿の承認ステップを定義します。デフォルトテンプレートがクライアントの承認に使用されます。
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard">ダッシュボードに戻る</Link>
        </Button>
      </div>

      {planBlocked ? (
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <Lock className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="font-semibold text-foreground">
              承認フローカスタマイズはStarterプラン以上で利用できます
            </p>
            <p className="text-sm text-muted-foreground">
              現在のプラン（{plan}）ではこの機能をご利用いただけません。
            </p>
            <Button asChild className="rounded-xl">
              <Link href="/settings/billing">プランをアップグレード</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ApprovalFlowEditor orgId={orgId} />
      )}
    </div>
  );
}

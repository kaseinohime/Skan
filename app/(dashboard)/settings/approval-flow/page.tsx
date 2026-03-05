import { getCurrentUser } from "@/lib/auth";
import { getCurrentUserAgencyOrganizationId } from "@/lib/organization";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ApprovalFlowEditor } from "./approval-flow-editor";

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
      <ApprovalFlowEditor orgId={orgId} />
    </div>
  );
}

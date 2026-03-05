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
import { Settings2 } from "lucide-react";
import { AccountSettingsForm } from "./account-settings-form";
import type { AccountSettingsInput } from "@/lib/validations/insights";

export const dynamic = "force-dynamic";

export default async function AccountSettingsPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;

  const { clientId } = await params;
  const supabase = await createClient();

  const [{ data: client, error }, { data: settings }] = await Promise.all([
    supabase.from("clients").select("id, name").eq("id", clientId).single(),
    supabase
      .from("client_account_settings")
      .select("*")
      .eq("client_id", clientId)
      .maybeSingle(),
  ]);

  if (error || !client) notFound();

  // clientロールは閲覧のみ
  const readOnly = user.system_role === "client";

  return (
    <div className="container mx-auto max-w-3xl space-y-6 p-8">
      {/* ヘッダー */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/clients/${clientId}`}>← ワークスペース</Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" />
            アカウント設計
          </h1>
          <p className="text-sm text-muted-foreground">{client.name}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">アカウント設定</CardTitle>
          <CardDescription>
            ペルソナ・KPI目標・ハッシュタグセット・ベンチマークアカウントを管理します。
            {readOnly && " （閲覧のみ）"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AccountSettingsForm
            clientId={clientId}
            initial={settings as AccountSettingsInput | null}
            readOnly={readOnly}
          />
        </CardContent>
      </Card>
    </div>
  );
}

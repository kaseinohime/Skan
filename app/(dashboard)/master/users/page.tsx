import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { UserRoleEditor } from "./user-role-editor";

export const dynamic = "force-dynamic";

const ROLE_LABELS: Record<string, string> = {
  master: "マスター",
  agency_admin: "企業管理者",
  staff: "スタッフ",
  client: "クライアント",
};

export default async function MasterUsersPage() {
  const user = await requireRole(["master"]);
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: users } = await supabase
    .from("users")
    .select("id, email, full_name, system_role, is_active, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="container mx-auto max-w-4xl space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/master">← マスター</Link>
          </Button>
          <h1 className="text-2xl font-bold">ユーザー一覧・ロール設定</h1>
        </div>
        <SignOutButton />
      </div>

      <p className="text-muted-foreground text-sm">
        system_role は public.users で管理しています。ここで変更するとログイン後のリダイレクト先やアクセス範囲が変わります。最初のマスターは Supabase の SQL で設定してください（supabase/scripts/set-master-role.sql）。
      </p>

      <UserRoleEditor
        users={users ?? []}
        roleLabels={ROLE_LABELS}
      />
    </div>
  );
}

import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { UserRoleEditor } from "./user-role-editor";
import { ChevronLeft } from "lucide-react";

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

  // ユーザー一覧
  const { data: users } = await supabase
    .from("users")
    .select("id, email, full_name, system_role, is_active, created_at")
    .order("created_at", { ascending: false });

  // 各ユーザーの所属組織（organization_members → organizations）
  const { data: memberships } = await supabase
    .from("organization_members")
    .select("user_id, role, organizations(id, name, subscription_plan)")
    .eq("is_active", true);

  // user_id → 所属組織リストのマップ
  type OrgInfo = { id: string; name: string; subscription_plan: string | null; role: string };
  const orgMap = new Map<string, OrgInfo[]>();
  for (const m of memberships ?? []) {
    const org = m.organizations as unknown as { id: string; name: string; subscription_plan: string | null } | null;
    if (!org) continue;
    const list = orgMap.get(m.user_id) ?? [];
    list.push({ ...org, role: m.role });
    orgMap.set(m.user_id, list);
  }

  const enrichedUsers = (users ?? []).map((u) => ({
    ...u,
    organizations: orgMap.get(u.id) ?? [],
  }));

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-8">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="rounded-lg" asChild>
          <Link href="/master">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-black text-foreground">ユーザー管理</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            全ユーザーのロール・所属組織を管理します
          </p>
        </div>
      </div>

      <UserRoleEditor users={enrichedUsers} roleLabels={ROLE_LABELS} />
    </div>
  );
}

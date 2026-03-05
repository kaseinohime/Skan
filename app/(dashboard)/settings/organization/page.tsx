import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { redirect } from "next/navigation";
import { OrgNameForm } from "./org-name-form";

export const metadata = { title: "組織設定 | エスカン" };
export const dynamic = "force-dynamic";

export default async function OrganizationSettingsPage() {
  const user = await requireRole(["master", "agency_admin"]);
  if (!user) redirect("/login");

  const supabase = await createClient();

  // 自分がagency_adminの組織を取得
  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id, organizations(id, name, description, slug)")
    .eq("user_id", user.id)
    .eq("role", "agency_admin")
    .eq("is_active", true)
    .single();

  type OrgData = { id: string; name: string; description: string | null; slug: string };
  const org = membership?.organizations as unknown as OrgData | null;

  if (!org) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-xl space-y-8 px-4 py-10">
      <div>
        <h1 className="text-2xl font-black text-foreground">組織設定</h1>
        <p className="mt-1 text-sm text-muted-foreground">組織名・説明をいつでも変更できます</p>
      </div>

      <div className="rounded-2xl border border-border/60 bg-white/60 backdrop-blur-md p-6 shadow-sm">
        <OrgNameForm org={org} />
      </div>
    </div>
  );
}

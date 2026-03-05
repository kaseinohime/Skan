import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AccountForm } from "./account-form";

export const metadata = { title: "アカウント設定 | エスカン" };
export const dynamic = "force-dynamic";

export default async function AccountSettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("users")
    .select("full_name, email")
    .eq("id", user.id)
    .single();

  return (
    <div className="mx-auto max-w-xl space-y-8 px-4 py-10">
      <div>
        <h1 className="text-2xl font-black text-foreground">アカウント設定</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          表示名・メールアドレス・パスワードを変更できます
        </p>
      </div>

      <AccountForm
        initialName={profile?.full_name ?? ""}
        initialEmail={profile?.email ?? user.email ?? ""}
      />
    </div>
  );
}

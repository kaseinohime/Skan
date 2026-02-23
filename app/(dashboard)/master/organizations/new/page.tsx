import { requireRole } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CreateOrganizationForm } from "../create-organization-form";

export const dynamic = "force-dynamic";

export default async function NewOrganizationPage() {
  const user = await requireRole(["master"]);
  if (!user) redirect("/login");

  return (
    <div className="container mx-auto max-w-lg space-y-8 p-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/master/organizations">← 企業一覧</Link>
        </Button>
        <h1 className="text-2xl font-bold">企業を追加</h1>
      </div>

      <CreateOrganizationForm />
    </div>
  );
}

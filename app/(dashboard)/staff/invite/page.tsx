import { getCurrentUser } from "@/lib/auth";
import { getCurrentUserAgencyOrganizationId } from "@/lib/organization";
import { redirect } from "next/navigation";
import { InviteStaffForm } from "./invite-staff-form";

export const dynamic = "force-dynamic";

export default async function StaffInvitePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const orgId = await getCurrentUserAgencyOrganizationId();
  if (!orgId) {
    redirect("/staff");
  }

  return (
    <div className="container mx-auto max-w-lg space-y-8 p-8">
      <div>
        <h1 className="text-2xl font-bold">スタッフを招待</h1>
        <p className="text-muted-foreground">
          メールアドレスでスタッフを招待し、企業に参加してもらいます
        </p>
      </div>
      <InviteStaffForm orgId={orgId} />
    </div>
  );
}

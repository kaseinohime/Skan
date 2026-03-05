import { processPendingInvitations } from "@/lib/invitations";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await processPendingInvitations();
  return (
    <DashboardShell>
      {children}
    </DashboardShell>
  );
}

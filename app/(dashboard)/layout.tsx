import { processPendingInvitations } from "@/lib/invitations";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await processPendingInvitations();
  return <div className="min-h-screen">{children}</div>;
}

"use client";

import { usePathname } from "next/navigation";
import { DashboardSidebar } from "./dashboard-sidebar";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMaster = pathname.startsWith("/master");

  if (isMaster) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />
      <main className="flex-1 pl-64">{children}</main>
    </div>
  );
}

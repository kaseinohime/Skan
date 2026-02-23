"use client";

import { usePathname } from "next/navigation";
import { DashboardSidebar } from "./dashboard-sidebar";
import { MasterSidebar } from "./master-sidebar";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMaster = pathname.startsWith("/master");

  return (
    <div className="flex min-h-screen">
      {isMaster ? <MasterSidebar /> : <DashboardSidebar />}
      <main className="flex-1 pl-64 bg-background">{children}</main>
    </div>
  );
}

"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { DashboardSidebar } from "./dashboard-sidebar";
import { MasterSidebar } from "./master-sidebar";
import { Menu, X } from "lucide-react";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMaster = pathname.startsWith("/master");
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* モバイルヘッダー */}
      <div className="fixed top-0 left-0 right-0 z-40 flex h-14 items-center border-b bg-background/95 backdrop-blur px-4 md:hidden">
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
          aria-label="メニューを開く"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <span className="ml-3 font-semibold">エスカン</span>
      </div>

      {/* モバイルオーバーレイ */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* サイドバー */}
      <div
        className={`fixed left-0 top-0 z-40 h-screen w-64 transition-transform duration-200 md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        onClick={() => setMobileOpen(false)}
      >
        {isMaster ? <MasterSidebar /> : <DashboardSidebar />}
      </div>

      {/* メインコンテンツ */}
      <main className="flex-1 md:pl-64 bg-background pt-14 md:pt-0">{children}</main>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Building2, Users, ArrowLeft } from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";

const navLink = (
  href: string,
  label: string,
  icon: React.ReactNode,
  active: boolean
) => (
  <Link
    key={href}
    href={href}
    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
      active
        ? "bg-primary text-primary-foreground"
        : "text-foreground/80 hover:bg-muted hover:text-foreground"
    }`}
  >
    <span className={active ? "text-primary-foreground" : "text-muted-foreground"}>
      {icon}
    </span>
    {label}
  </Link>
);

export function MasterSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-64 flex-col bg-muted/50 border-r border-border">
      <div className="flex h-14 items-center border-b border-border bg-background/80 px-4">
        <Link href="/master" className="font-semibold text-foreground">
          エスカン マスター
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        <p className="mb-1 px-2 text-xs font-medium text-muted-foreground">
          マスター管理
        </p>
        {navLink(
          "/master",
          "マスターダッシュボード",
          <LayoutDashboard className="h-4 w-4" />,
          pathname === "/master"
        )}
        {navLink(
          "/master/organizations",
          "企業一覧",
          <Building2 className="h-4 w-4" />,
          pathname.startsWith("/master/organizations")
        )}
        {navLink(
          "/master/users",
          "ユーザー一覧",
          <Users className="h-4 w-4" />,
          pathname.startsWith("/master/users")
        )}
      </nav>

      <div className="space-y-1 border-t border-border p-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground/80 hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 text-muted-foreground" />
          ダッシュボードに戻る
        </Link>
        <SignOutButton variant="ghost" className="w-full justify-start text-foreground/80 hover:text-foreground" />
      </div>
    </aside>
  );
}

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
    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
      active
        ? "bg-primary text-primary-foreground shadow-sm"
        : "text-foreground/70 hover:bg-primary/8 hover:text-foreground"
    }`}
  >
    <span className={`flex-shrink-0 ${active ? "text-primary-foreground" : "text-foreground/50"}`}>
      {icon}
    </span>
    {label}
  </Link>
);

export function MasterSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-64 flex-col bg-white shadow-[2px_0_16px_rgba(0,0,0,0.06)]">
      {/* ロゴ */}
      <div className="flex h-16 items-center gap-3 px-5 border-b border-border/40">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-sm font-bold shadow-sm">
          S
        </div>
        <Link href="/master" className="text-base font-bold text-foreground tracking-tight">
          エスカン <span className="text-xs font-medium text-muted-foreground ml-1">Master</span>
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
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

      <div className="space-y-1 border-t border-border/40 px-3 py-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground/70 hover:bg-primary/8 hover:text-foreground transition-all duration-150"
        >
          <ArrowLeft className="h-4 w-4 text-foreground/50" />
          ダッシュボードに戻る
        </Link>
        <SignOutButton variant="ghost" className="w-full justify-start text-foreground/60 hover:text-foreground text-sm rounded-xl" />
      </div>
    </aside>
  );
}

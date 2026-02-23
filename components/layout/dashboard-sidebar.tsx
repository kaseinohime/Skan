"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  Calendar,
  FileText,
  FolderKanban,
  Pin,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SignOutButton } from "@/components/auth/sign-out-button";
import type { Client } from "@/types";

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

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);

  const clientIdFromPath =
    pathname.startsWith("/clients/") && pathname !== "/clients" && pathname !== "/clients/new"
      ? pathname.split("/")[2]
      : null;

  useEffect(() => {
    fetch("/api/clients")
      .then((res) => (res.ok ? res.json() : { clients: [] }))
      .then((data) => setClients(data.clients ?? []))
      .catch(() => setClients([]));
  }, []);

  const currentClient = clientIdFromPath
    ? clients.find((c) => c.id === clientIdFromPath)
    : null;

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-64 flex-col bg-muted/50 border-r border-border">
      <div className="flex h-14 items-center border-b border-border bg-background/80 px-4">
        <Link href="/dashboard" className="font-semibold text-foreground">
          エスカン
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        <p className="mb-1 px-2 text-xs font-medium text-muted-foreground">
          メイン
        </p>
        {navLink(
          "/dashboard",
          "ダッシュボード",
          <LayoutDashboard className="h-4 w-4" />,
          pathname === "/dashboard"
        )}
        {navLink(
          "/clients",
          "クライアント一覧",
          <Building2 className="h-4 w-4" />,
          pathname === "/clients" || pathname === "/clients/new"
        )}
        {navLink(
          "/staff",
          "スタッフ",
          <Users className="h-4 w-4" />,
          pathname.startsWith("/staff")
        )}

        {clientIdFromPath && currentClient && (
          <>
            <p className="mb-1 mt-4 px-2 text-xs font-medium text-muted-foreground">
              ワークスペース
            </p>
            <div className="mb-1 flex items-center gap-2 px-2 text-sm text-muted-foreground">
              <Pin className="h-3.5 w-3.5" />
              <span className="truncate font-medium text-foreground">
                {currentClient.name}
              </span>
            </div>
            {navLink(
              `/clients/${clientIdFromPath}`,
              "概要",
              <LayoutDashboard className="h-4 w-4" />,
              pathname === `/clients/${clientIdFromPath}`
            )}
            {navLink(
              `/clients/${clientIdFromPath}/campaigns`,
              "企画",
              <FolderKanban className="h-4 w-4" />,
              pathname.startsWith(`/clients/${clientIdFromPath}/campaigns`)
            )}
            {navLink(
              `/clients/${clientIdFromPath}/posts`,
              "投稿一覧",
              <FileText className="h-4 w-4" />,
              pathname.startsWith(`/clients/${clientIdFromPath}/posts`)
            )}
            {navLink(
              `/clients/${clientIdFromPath}/calendar`,
              "カレンダー",
              <Calendar className="h-4 w-4" />,
              pathname === `/clients/${clientIdFromPath}/calendar`
            )}
            {navLink(
              `/clients/${clientIdFromPath}/team`,
              "チーム",
              <Users className="h-4 w-4" />,
              pathname === `/clients/${clientIdFromPath}/team`
            )}
          </>
        )}
      </nav>

      {clients.length > 0 && (
        <div className="border-t border-border p-3">
          <p className="mb-2 px-2 text-xs font-medium text-muted-foreground">
            ワークスペース切替
          </p>
          <Select
            value={clientIdFromPath ?? ""}
            onValueChange={(id) => {
              if (id) router.push(`/clients/${id}`);
            }}
          >
            <SelectTrigger className="w-full rounded-lg bg-background">
              <SelectValue placeholder="クライアントを選択" />
            </SelectTrigger>
            <SelectContent>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="border-t border-border p-3">
        <SignOutButton variant="ghost" className="text-foreground/80 hover:text-foreground" />
      </div>
    </aside>
  );
}

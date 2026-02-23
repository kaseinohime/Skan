"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Building2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SignOutButton } from "@/components/auth/sign-out-button";
import type { Client } from "@/types";

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);

  const clientIdFromPath = pathname.startsWith("/clients/")
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
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-64 flex-col border-r bg-card">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <Link href="/dashboard" className="font-semibold text-foreground">
          エスカン
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        <Link
          href="/dashboard"
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
            pathname === "/dashboard"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <LayoutDashboard className="h-4 w-4" />
          ダッシュボード
        </Link>
        <Link
          href="/clients"
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
            pathname === "/clients" || pathname === "/clients/new"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Building2 className="h-4 w-4" />
          クライアント一覧
        </Link>
      </nav>
      {clients.length > 0 && (
        <div className="border-t p-3">
          <p className="mb-2 px-2 text-xs font-medium text-muted-foreground">
            ワークスペース切替
          </p>
          <Select
            value={clientIdFromPath ?? ""}
            onValueChange={(id) => {
              if (id) router.push(`/clients/${id}`);
            }}
          >
            <SelectTrigger className="w-full">
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
      <div className="border-t p-3">
        <SignOutButton />
      </div>
    </aside>
  );
}

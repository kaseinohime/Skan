"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  Building2,
  Users,
  Calendar,
  FileText,
  FileCheck,
  FolderKanban,
  Pin,
  Bell,
  Settings,
  BarChart2,
  FileDown,
  Search,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ColorPickerPopover } from "@/components/theme/color-picker-popover";
import {
  DEFAULT_COLOR,
  getGlobalColor,
  getClientColor,
  saveGlobalColor,
  saveClientColor,
  applyColor,
  type ColorPreset,
} from "@/lib/theme";
import type { Client } from "@/types";

const navLink = (
  href: string,
  label: string,
  icon: React.ReactNode,
  active: boolean,
  badge?: React.ReactNode
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
    <span className="flex-1 truncate">{label}</span>
    {badge}
  </Link>
);

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingApprovalCount, setPendingApprovalCount] = useState(0);
  const [globalColor, setGlobalColor] = useState<ColorPreset>(DEFAULT_COLOR);
  const [clientColor, setClientColor] = useState<ColorPreset | null>(null);

  const clientIdFromPath =
    pathname.startsWith("/clients/") && pathname !== "/clients" && pathname !== "/clients/new"
      ? pathname.split("/")[2]
      : null;

  const currentClient = clientIdFromPath
    ? clients.find((c) => c.id === clientIdFromPath)
    : null;

  // マウント時にグローバルカラーを読み込んで適用
  useEffect(() => {
    const gc = getGlobalColor();
    setGlobalColor(gc);
    applyColor(gc.hsl);
  }, []);

  // クライアントが変わったらクライアントカラーを切り替え
  useEffect(() => {
    const gc = getGlobalColor();
    if (clientIdFromPath) {
      const cc = getClientColor(clientIdFromPath);
      setClientColor(cc);
      applyColor((cc ?? gc).hsl);
    } else {
      setClientColor(null);
      applyColor(gc.hsl);
    }
  }, [clientIdFromPath]);

  useEffect(() => {
    fetch("/api/clients")
      .then((res) => (res.ok ? res.json() : { clients: [] }))
      .then((data) => setClients(data.clients ?? []))
      .catch(() => setClients([]));
  }, []);

  const fetchUnreadCount = () => {
    fetch("/api/notifications/unread-count")
      .then((res) => (res.ok ? res.json() : { count: 0 }))
      .then((data) => setUnreadCount(data.count ?? 0))
      .catch(() => setUnreadCount(0));
  };

  const fetchPendingApprovalCount = () => {
    fetch("/api/approval/pending-count")
      .then((res) => (res.ok ? res.json() : { count: 0 }))
      .then((data) => setPendingApprovalCount(data.count ?? 0))
      .catch(() => setPendingApprovalCount(0));
  };

  useEffect(() => {
    fetchUnreadCount();
    fetchPendingApprovalCount();
  }, [pathname]);

  // Realtime: 自分宛の通知が届いたら未読数を再取得
  useEffect(() => {
    let supabase: ReturnType<typeof createClient> | null = null;
    try {
      supabase = createClient();
    } catch {
      return;
    }
    const channel = supabase
      .channel("notifications-badge")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  }, []);

  const handleGlobalColorChange = (color: ColorPreset) => {
    saveGlobalColor(color);
    setGlobalColor(color);
    // クライアント専用設定がなければグローバルを適用
    if (!clientColor) {
      applyColor(color.hsl);
    }
  };

  const handleClientColorChange = (color: ColorPreset | null) => {
    if (!clientIdFromPath) return;
    saveClientColor(clientIdFromPath, color);
    setClientColor(color);
    applyColor((color ?? globalColor).hsl);
  };

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-64 flex-col bg-white/80 backdrop-blur-xl border-r border-white/40 shadow-[2px_0_20px_rgba(99,102,241,0.08)]">
      {/* ロゴ */}
      <div className="flex h-16 items-center gap-3 px-5 border-b border-border/40">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-sm font-bold shadow-sm">
          S
        </div>
        <Link href="/dashboard" className="text-base font-bold text-foreground tracking-tight">
          エスカン
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
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
        {navLink(
          "/search",
          "投稿を検索",
          <Search className="h-4 w-4" />,
          pathname === "/search"
        )}
        {navLink(
          "/settings/approval-flow",
          "承認フロー設定",
          <Settings className="h-4 w-4" />,
          pathname.startsWith("/settings")
        )}
        {/* 承認待ち（バッジ付き） */}
        <Link
          href="/approval"
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
            pathname === "/approval"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-foreground/70 hover:bg-primary/8 hover:text-foreground"
          }`}
        >
          <span className={`flex-shrink-0 ${pathname === "/approval" ? "text-primary-foreground" : "text-foreground/50"}`}>
            <FileCheck className="h-4 w-4" />
          </span>
          <span className="flex-1">承認待ち</span>
          {pendingApprovalCount > 0 && (
            <span className="ml-auto rounded-full bg-amber-500 px-2 py-0.5 text-xs text-white font-semibold shadow-sm">
              {pendingApprovalCount > 99 ? "99+" : pendingApprovalCount}
            </span>
          )}
        </Link>
        {/* 通知（バッジ付き） */}
        <Link
          href="/notifications"
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
            pathname === "/notifications"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-foreground/70 hover:bg-primary/8 hover:text-foreground"
          }`}
        >
          <span className={`flex-shrink-0 ${pathname === "/notifications" ? "text-primary-foreground" : "text-foreground/50"}`}>
            <Bell className="h-4 w-4" />
          </span>
          <span className="flex-1">通知</span>
          {unreadCount > 0 && (
            <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground font-semibold shadow-sm">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Link>

        {clientIdFromPath && currentClient && (
          <>
            <div className="my-3 border-t border-border/40" />
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
              ワークスペース
            </p>
            {/* クライアント名＋カラードット */}
            <div className="mb-2 flex items-center gap-2 px-3 py-1">
              <div
                className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md shadow-sm"
                style={{
                  backgroundColor: `hsl(${(clientColor ?? globalColor).hsl})`,
                }}
              >
                <Pin className="h-3 w-3 text-white" />
              </div>
              <span className="truncate text-xs font-semibold text-foreground">
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
              `/clients/${clientIdFromPath}/insights`,
              "インサイス",
              <BarChart2 className="h-4 w-4" />,
              pathname.startsWith(`/clients/${clientIdFromPath}/insights`)
            )}
            {navLink(
              `/clients/${clientIdFromPath}/team`,
              "チーム",
              <Users className="h-4 w-4" />,
              pathname === `/clients/${clientIdFromPath}/team`
            )}
            {navLink(
              `/clients/${clientIdFromPath}/report`,
              "月次レポート",
              <FileDown className="h-4 w-4" />,
              pathname === `/clients/${clientIdFromPath}/report`
            )}
          </>
        )}
      </nav>

      {clients.length > 0 && (
        <div className="border-t border-border/40 px-3 py-3">
          <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
            ワークスペース切替
          </p>
          <Select
            value={clientIdFromPath ?? ""}
            onValueChange={(id) => {
              if (id) router.push(`/clients/${id}`);
            }}
          >
            <SelectTrigger className="w-full rounded-xl bg-muted/40 border-border/40 text-sm">
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

      {/* フッター：カラーピッカー＋サインアウト */}
      <div className="border-t border-border/40 px-3 py-3 space-y-1">
        <ColorPickerPopover
          globalColor={globalColor}
          clientColor={clientColor}
          clientName={currentClient?.name}
          onGlobalChange={handleGlobalColorChange}
          onClientChange={handleClientColorChange}
        />
        <SignOutButton
          variant="ghost"
          className="w-full justify-start text-foreground/60 hover:text-foreground text-sm rounded-xl"
        />
      </div>
    </aside>
  );
}

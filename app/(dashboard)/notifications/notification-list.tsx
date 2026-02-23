"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";

type NotificationRow = {
  id: string;
  title: string;
  body: string | null;
  type: string;
  reference_type: string | null;
  reference_id: string | null;
  is_read: boolean;
  created_at: string;
};

export function NotificationList({
  initialNotifications,
}: {
  initialNotifications: NotificationRow[];
  currentUserId?: string;
}) {
  const [notifications, setNotifications] = useState(initialNotifications);

  const markRead = async (id: string) => {
    const res = await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    if (!res.ok) return;
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const markAllRead = async () => {
    const res = await fetch("/api/notifications/read-all", { method: "PATCH" });
    if (!res.ok) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (notifications.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">通知はありません</p>
    );
  }

  return (
    <div className="space-y-2">
      {unreadCount > 0 && (
        <div className="flex justify-end pb-2">
          <Button variant="ghost" size="sm" onClick={markAllRead}>
            すべて既読にする
          </Button>
        </div>
      )}
      <ul className="divide-y">
        {notifications.map((n) => (
          <li
            key={n.id}
            className={`py-3 ${!n.is_read ? "bg-muted/30" : ""}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{n.title}</p>
                {n.body && (
                  <p className="text-muted-foreground text-sm mt-0.5">{n.body}</p>
                )}
                <p className="text-muted-foreground text-xs mt-1">
                  {formatDistanceToNow(new Date(n.created_at), {
                    addSuffix: true,
                    locale: ja,
                  })}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {!n.is_read && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => markRead(n.id)}
                  >
                    既読
                  </Button>
                )}
                {n.reference_type === "post" && n.reference_id && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard`}>開く</Link>
                  </Button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

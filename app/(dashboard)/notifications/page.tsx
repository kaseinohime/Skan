import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Bell } from "lucide-react";
import { NotificationList } from "./notification-list";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, title, body, type, reference_type, reference_id, is_read, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const unreadCount = (notifications ?? []).filter((n) => !n.is_read).length;

  return (
    <div className="container mx-auto max-w-2xl space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6" />
            通知
          </h1>
          <p className="text-muted-foreground mt-1">
            {unreadCount > 0 ? `未読 ${unreadCount} 件` : "すべて既読です"}
          </p>
        </div>
        <Button variant="outline" size="sm" className="rounded-lg" asChild>
          <Link href="/dashboard">ダッシュボードへ</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>通知一覧</CardTitle>
          <CardDescription>
            承認依頼・結果など、同じ企業・クライアントの通知が届きます
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NotificationList initialNotifications={notifications ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}

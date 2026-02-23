import { getCurrentUser } from "@/lib/auth";
import { getCurrentUserAgencyOrganizationId } from "@/lib/organization";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, UserPlus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function StaffListPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const orgId = await getCurrentUserAgencyOrganizationId();
  if (!orgId) {
    return (
      <div className="container mx-auto max-w-3xl space-y-8 p-8">
        <h1 className="text-2xl font-bold">スタッフ一覧</h1>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {user.system_role === "master" ? (
              <>
                マスターの場合は企業詳細からメンバーを確認できます。
                <br />
                <Link href="/master/organizations" className="text-primary underline">
                  企業一覧へ
                </Link>
              </>
            ) : (
              "企業に所属していないため、スタッフ一覧を表示できません。"
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: members } = await supabase
    .from("organization_members")
    .select(
      `
      id,
      user_id,
      role,
      is_active,
      invited_at,
      joined_at,
      users(id, email, full_name)
    `
    )
    .eq("organization_id", orgId)
    .order("joined_at", { nullsFirst: true });

  return (
    <div className="container mx-auto max-w-4xl space-y-8 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">スタッフ一覧</h1>
        {(user.system_role === "agency_admin" || user.system_role === "master") && orgId && (
          <Button asChild>
            <Link href="/staff/invite">
              <UserPlus className="mr-2 h-4 w-4" />
              スタッフを招待
            </Link>
          </Button>
        )}
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            企業メンバー
          </CardTitle>
          <CardDescription>
            この企業に所属するスタッフと管理者の一覧です
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!members?.length ? (
            <p className="py-8 text-center text-muted-foreground">
              メンバーがいません。スタッフを招待してください。
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名前</TableHead>
                  <TableHead>メール</TableHead>
                  <TableHead>ロール</TableHead>
                  <TableHead>参加日</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((m: { id: string; role: string; is_active: boolean; joined_at: string | null; users: { full_name?: string; email?: string } | { full_name?: string; email?: string }[] | null }) => {
                  const u = Array.isArray(m.users) ? m.users[0] ?? null : m.users;
                  return (
                    <TableRow key={m.id}>
                      <TableCell>{u?.full_name ?? "—"}</TableCell>
                      <TableCell>{u?.email ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={m.role === "agency_admin" ? "default" : "secondary"}>
                          {m.role === "agency_admin" ? "管理者" : "スタッフ"}
                        </Badge>
                        {!m.is_active && (
                          <Badge variant="outline" className="ml-1">
                            無効
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {m.joined_at
                          ? new Date(m.joined_at).toLocaleDateString("ja-JP")
                          : "招待中"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type MemberRow = {
  id: string;
  user_id: string;
  role: string;
  is_active: boolean;
  joined_at: string | null;
  users: { id: string; email: string; full_name: string } | { id: string; email: string; full_name: string }[] | null;
};
type InvitationRow = { id: string; email: string; role: string; created_at: string };
type OrgMemberRow = {
  id: string;
  user_id: string;
  users: { id: string; email: string; full_name: string } | { id: string; email: string; full_name: string }[] | null;
};

export function TeamMemberList({
  clientId,
  members,
  invitations,
  orgMembers,
  canManage,
}: {
  clientId: string;
  members: MemberRow[];
  invitations: InvitationRow[];
  orgMembers: OrgMemberRow[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [addUserId, setAddUserId] = useState("");
  const [role, setRole] = useState<"staff" | "client">("staff");
  const [error, setError] = useState<string | null>(null);

  const memberUserIds = new Set(members.map((m) => m.user_id));
  const availableOrgMembers = orgMembers.filter((om) => !memberUserIds.has(om.user_id));

  const handleAddByUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addUserId) return;
    setError(null);
    setAdding(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: addUserId, role }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error?.message ?? "追加に失敗しました。");
        setAdding(false);
        return;
      }
      setAddUserId("");
      router.refresh();
    } catch {
      setError("通信エラーが発生しました。");
    } finally {
      setAdding(false);
    }
  };

  const handleInviteByEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setError(null);
    setAdding(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error?.message ?? "招待に失敗しました。");
        setAdding(false);
        return;
      }
      setInviteEmail("");
      router.refresh();
    } catch {
      setError("通信エラーが発生しました。");
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!confirm("このメンバーをワークスペースから除外しますか？")) return;
    try {
      const res = await fetch(`/api/clients/${clientId}/members/${memberId}`, {
        method: "DELETE",
      });
      if (res.ok) router.refresh();
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      )}

      {invitations.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-medium">招待中</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>メール</TableHead>
                <TableHead>ロール</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invitations.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell>{inv.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {inv.role === "client" ? "クライアント" : "スタッフ"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>名前</TableHead>
            <TableHead>メール</TableHead>
            <TableHead>ロール</TableHead>
            {canManage && <TableHead className="w-[100px]" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((m) => {
            const u = Array.isArray(m.users) ? m.users[0] ?? null : m.users;
            return (
              <TableRow key={m.id}>
                <TableCell>{u?.full_name ?? "—"}</TableCell>
                <TableCell>{u?.email ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={m.role === "client" ? "outline" : "secondary"}>
                    {m.role === "client" ? "クライアント" : "スタッフ"}
                  </Badge>
                  {!m.is_active && (
                    <Badge variant="outline" className="ml-1">
                      無効
                    </Badge>
                  )}
                </TableCell>
                {canManage && (
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => handleRemove(m.id)}
                    >
                      除外
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {members.length === 0 && invitations.length === 0 && (
        <p className="py-4 text-center text-muted-foreground text-sm">
          メンバーがいません。企業のスタッフを追加するか、メールで招待してください。
        </p>
      )}

      {canManage && (
        <div className="space-y-4 border-t pt-6">
          <h4 className="text-sm font-medium">メンバーを追加</h4>
          {availableOrgMembers.length > 0 && (
            <form onSubmit={handleAddByUser} className="flex flex-wrap items-end gap-4">
              <div className="space-y-2">
                <Label>企業のスタッフから追加</Label>
                <Select value={addUserId} onValueChange={setAddUserId} disabled={adding}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableOrgMembers.map((om) => {
                      const ou = Array.isArray(om.users) ? om.users[0] ?? null : om.users;
                      return (
                        <SelectItem key={om.id} value={om.user_id}>
                          {ou?.full_name ?? ou?.email ?? om.user_id}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>ロール</Label>
                <Select
                  value={role}
                  onValueChange={(v) => setRole(v as "staff" | "client")}
                  disabled={adding}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">スタッフ</SelectItem>
                    <SelectItem value="client">クライアント</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={adding || !addUserId}>
                {adding ? "追加中…" : "追加"}
              </Button>
            </form>
          )}
          <form onSubmit={handleInviteByEmail} className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label>メールで招待（新規または未追加のユーザー）</Label>
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="email@example.com"
                disabled={adding}
                className="w-[240px]"
              />
            </div>
            <div className="space-y-2">
              <Label>ロール</Label>
              <Select
                value={role}
                onValueChange={(v) => setRole(v as "staff" | "client")}
                disabled={adding}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">スタッフ</SelectItem>
                  <SelectItem value="client">クライアント</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={adding || !inviteEmail.trim()}>
              {adding ? "送信中…" : "招待を送信"}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}

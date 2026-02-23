"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type UserRow = {
  id: string;
  email: string;
  full_name: string;
  system_role: string;
  is_active: boolean;
  created_at: string;
};

export function UserRoleEditor({
  users,
  roleLabels,
}: {
  users: UserRow[];
  roleLabels: Record<string, string>;
}) {
  const router = useRouter();
  const [savingId, setSavingId] = useState<string | null>(null);
  const [localRoles, setLocalRoles] = useState<Record<string, string>>(
    () => Object.fromEntries(users.map((u) => [u.id, u.system_role]))
  );

  const handleRoleChange = async (userId: string, newRole: string) => {
    setSavingId(userId);
    try {
      const res = await fetch(`/api/master/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system_role: newRole }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data?.error?.message ?? "更新に失敗しました");
        return;
      }
      setLocalRoles((prev) => ({ ...prev, [userId]: newRole }));
      router.refresh();
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>メール</TableHead>
            <TableHead>表示名</TableHead>
            <TableHead>ロール</TableHead>
            <TableHead>状態</TableHead>
            <TableHead className="w-[120px]">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-muted-foreground text-center">
                ユーザーがいません。
              </TableCell>
            </TableRow>
          ) : (
            users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.email}</TableCell>
                <TableCell>{u.full_name}</TableCell>
                <TableCell>{roleLabels[u.system_role] ?? u.system_role}</TableCell>
                <TableCell>{u.is_active ? "有効" : "無効"}</TableCell>
                <TableCell>
                  <Select
                    value={localRoles[u.id] ?? u.system_role}
                    onValueChange={(value) => handleRoleChange(u.id, value)}
                    disabled={savingId === u.id}
                  >
                    <SelectTrigger className="h-8 w-[130px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(["master", "agency_admin", "staff", "client"] as const).map(
                        (role) => (
                          <SelectItem key={role} value={role}>
                            {roleLabels[role]}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

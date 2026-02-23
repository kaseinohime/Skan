"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function InviteMemberForm({ orgId }: { orgId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"agency_admin" | "staff">("staff");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/organizations/${orgId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error?.message ?? "招待に失敗しました。");
        setLoading(false);
        return;
      }
      setEmail("");
      router.refresh();
    } catch {
      setError("通信エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>ユーザーを招待</CardTitle>
          <CardDescription>
            メールアドレスで招待します。招待リンクが送信され、登録後にこの企業に参加します。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">メールアドレス *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">ロール</Label>
            <Select
              value={role}
              onValueChange={(v) => setRole(v as "agency_admin" | "staff")}
              disabled={loading}
            >
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="agency_admin">企業管理者</SelectItem>
                <SelectItem value="staff">スタッフ</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={loading || !email.trim()}>
            {loading ? "送信中…" : "招待を送信"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

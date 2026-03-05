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
import { UserPlus } from "lucide-react";

export function InviteMemberForm({ orgId }: { orgId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"agency_admin" | "staff">("staff");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
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
        return;
      }
      setEmail("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      router.refresh();
    } catch {
      setError("通信エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <p className="text-sm font-semibold text-foreground mb-3">メンバーを招待</p>
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-48 space-y-1.5">
          <Label htmlFor="email" className="text-xs">メールアドレス</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            required
            disabled={loading}
            className="rounded-xl"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">ロール</Label>
          <Select
            value={role}
            onValueChange={(v) => setRole(v as "agency_admin" | "staff")}
            disabled={loading}
          >
            <SelectTrigger className="w-36 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="agency_admin">企業管理者</SelectItem>
              <SelectItem value="staff">スタッフ</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" disabled={loading || !email.trim()} className="rounded-xl gap-1.5">
          <UserPlus className="h-4 w-4" />
          {loading ? "送信中…" : "招待を送信"}
        </Button>
      </div>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      {success && <p className="text-sm text-emerald-600 mt-2">招待メールを送信しました</p>}
    </form>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

export function InviteStaffForm({ orgId }: { orgId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/organizations/${orgId}/members/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role: "staff" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error?.message ?? "招待に失敗しました。");
        setLoading(false);
        return;
      }
      router.push("/staff");
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
          <CardTitle>招待メール</CardTitle>
          <CardDescription>
            招待するスタッフのメールアドレスを入力してください。招待リンクが送信されます。
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
              placeholder="staff@example.com"
              required
              disabled={loading}
            />
          </div>
        </CardContent>
        <CardFooter className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? "送信中…" : "招待を送信"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/staff">キャンセル</Link>
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

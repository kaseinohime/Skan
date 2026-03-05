"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Loader2 } from "lucide-react";

type Org = { id: string; name: string; description: string | null; slug: string };

export function OrgNameForm({ org }: { org: Org }) {
  const router = useRouter();
  const [name, setName] = useState(org.name);
  const [description, setDescription] = useState(org.description ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("組織名を入力してください"); return; }
    setSaving(true);
    setError(null);
    setSaved(false);

    const res = await fetch(`/api/organizations/${org.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), description: description.trim() }),
    });
    const data = await res.json().catch(() => ({}));

    setSaving(false);
    if (!res.ok) {
      setError(data?.error?.message ?? "保存に失敗しました");
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="name">組織名 <span className="text-destructive">*</span></Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="株式会社〇〇"
          required
          disabled={saving}
          className="rounded-xl"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">説明（任意）</Label>
        <Input
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="SNS運用代行専門のエージェンシー"
          disabled={saving}
          className="rounded-xl"
        />
      </div>

      <div className="text-xs text-muted-foreground">
        スラッグ（URL）: <span className="font-mono">{org.slug}</span>
        <span className="ml-1">（変更不可）</span>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-3">
        {saved && (
          <span className="flex items-center gap-1 text-sm text-emerald-600">
            <Check className="h-4 w-4" />
            保存しました
          </span>
        )}
        <Button type="submit" disabled={saving} className="ml-auto rounded-xl">
          {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          保存する
        </Button>
      </div>
    </form>
  );
}

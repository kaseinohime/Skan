"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Link2, Copy, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

type GuestLink = {
  id: string;
  token: string;
  scope: string;
  campaign_id: string | null;
  post_id: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
};

type CampaignOption = { id: string; name: string };
type PostOption = { id: string; title: string | null };

type Props = {
  clientId: string;
  campaigns: CampaignOption[];
  posts: PostOption[];
};

const scopeLabel: Record<string, string> = {
  client: "クライアント全体",
  campaign: "企画単位",
  post: "投稿単位",
};

export function GuestLinksSection({
  clientId,
  campaigns,
  posts,
}: Props) {
  const router = useRouter();
  const [links, setLinks] = useState<GuestLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [scope, setScope] = useState<"client" | "campaign" | "post">("client");
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [postId, setPostId] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newShareUrl, setNewShareUrl] = useState<string | null>(null);

  const fetchLinks = useCallback(async () => {
    const res = await fetch(`/api/clients/${clientId}/guest-links`);
    const data = await res.json().catch(() => ({}));
    setLinks(Array.isArray(data?.links) ? data.links : []);
  }, [clientId]);

  useEffect(() => {
    fetchLinks().finally(() => setLoading(false));
  }, [fetchLinks]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNewShareUrl(null);
    if (scope === "campaign" && !campaignId) {
      setError("企画を選択してください。");
      return;
    }
    if (scope === "post" && !postId) {
      setError("投稿を選択してください。");
      return;
    }
    setCreateLoading(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/guest-links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope,
          campaignId: scope === "campaign" ? campaignId : null,
          postId: scope === "post" ? postId : null,
          expiresAt: expiresAt.trim() ? expiresAt.trim() : null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error?.message ?? "作成に失敗しました。");
        setCreateLoading(false);
        return;
      }
      setNewShareUrl(data?.link?.share_url ?? null);
      setExpiresAt("");
      setCampaignId(null);
      setPostId(null);
      fetchLinks();
    } catch {
      setError("作成に失敗しました。");
    }
    setCreateLoading(false);
  };

  const copyUrl = (url: string) => {
    const base =
      typeof window !== "undefined" && window.location?.origin
        ? window.location.origin
        : "";
    const full = url.startsWith("http") ? url : `${base}${url}`;
    void navigator.clipboard.writeText(full);
  };

  const handleInvalidate = async (linkId: string) => {
    if (!confirm("このリンクを無効にしますか？")) return;
    const res = await fetch(`/api/guest-links/${linkId}`, { method: "DELETE" });
    if (res.ok) {
      fetchLinks();
      router.refresh();
    }
  };

  const baseUrl =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Link2 className="h-4 w-4" />
          ゲスト閲覧リンク
        </CardTitle>
        <CardDescription>
          ログイン不要で共有できるリンクを発行できます。スコープと有効期限を設定できます。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setDialogOpen(true);
            setError(null);
            setNewShareUrl(null);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          リンクを発行
        </Button>

        {dialogOpen && (
          <form
            onSubmit={handleCreate}
            className="rounded-lg border bg-muted/30 p-4 space-y-4"
          >
            <h3 className="font-medium">新規リンク</h3>
            <div className="space-y-2">
              <Label>スコープ</Label>
              <Select
                value={scope}
                onValueChange={(v) => {
                  setScope(v as "client" | "campaign" | "post");
                  setCampaignId(null);
                  setPostId(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">クライアント全体</SelectItem>
                  <SelectItem value="campaign">企画単位</SelectItem>
                  <SelectItem value="post">投稿単位</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {scope === "campaign" && (
              <div className="space-y-2">
                <Label>企画</Label>
                <Select
                  value={campaignId ?? ""}
                  onValueChange={(v) => setCampaignId(v || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="企画を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {campaigns.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {scope === "post" && (
              <div className="space-y-2">
                <Label>投稿</Label>
                <Select
                  value={postId ?? ""}
                  onValueChange={(v) => setPostId(v || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="投稿を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {posts.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title || "無題"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>有効期限（任意）</Label>
              <Input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            {newShareUrl && (
              <div className="rounded border bg-background p-3">
                <p className="text-sm font-medium mb-1">発行しました。URLをコピーして共有してください。</p>
                <div className="flex gap-2">
                  <Input readOnly value={newShareUrl} className="font-mono text-xs" />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyUrl(newShareUrl)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <Button type="submit" disabled={createLoading}>
                {createLoading ? "発行中…" : "発行"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  setNewShareUrl(null);
                }}
              >
                キャンセル
              </Button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="text-muted-foreground text-sm">読み込み中...</p>
        ) : links.length === 0 ? (
          <p className="text-muted-foreground text-sm">まだリンクはありません。</p>
        ) : (
          <ul className="space-y-2">
            {links.map((link) => {
              const url = `${baseUrl}/shared/${link.token}`;
              const isExpired =
                link.expires_at && new Date(link.expires_at) < new Date();
              return (
                <li
                  key={link.id}
                  className="flex items-center justify-between rounded border bg-background px-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <span className="font-medium">{scopeLabel[link.scope] ?? link.scope}</span>
                    {!link.is_active && (
                      <span className="ml-2 text-destructive">（無効）</span>
                    )}
                    {isExpired && (
                      <span className="ml-2 text-muted-foreground">（期限切れ）</span>
                    )}
                    <p className="text-muted-foreground truncate text-xs">{url}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {link.is_active && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => copyUrl(url)}
                        title="URLをコピー"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                    {link.is_active && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleInvalidate(link.id)}
                        title="無効にする"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

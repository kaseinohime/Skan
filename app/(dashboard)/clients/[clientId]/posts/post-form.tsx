"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AssigneesEditor } from "@/components/assignees-editor";
import type { PostType, PostPlatform, PostStatus } from "@/types";

const postTypeOptions: { value: PostType; label: string }[] = [
  { value: "feed", label: "フィード" },
  { value: "reel", label: "リール" },
  { value: "story", label: "ストーリー" },
  { value: "tiktok", label: "TikTok" },
];
const platformOptions: { value: PostPlatform; label: string }[] = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
];
const statusOptions: { value: PostStatus; label: string }[] = [
  { value: "draft", label: "下書き" },
  { value: "in_progress", label: "作成中" },
  { value: "pending_review", label: "承認待ち" },
  { value: "revision", label: "差し戻し" },
  { value: "approved", label: "承認済み" },
  { value: "scheduled", label: "予約済み" },
  { value: "published", label: "公開済み" },
];

type CampaignOption = { id: string; name: string };

type Props = {
  clientId: string;
  postId?: string;
  campaigns: CampaignOption[];
  defaultCampaignId?: string | null;
  defaultDirectorIds?: string[];
  defaultEditorIds?: string[];
  defaultValues?: {
    title: string;
    caption: string;
    hashtags: string[];
    post_type: PostType;
    platform: PostPlatform;
    status: PostStatus;
    scheduled_at: string;
    media_urls: string[];
    campaign_id: string | null;
  };
};

function toISO(s: string): string {
  if (!s) return "";
  const d = new Date(s);
  return isNaN(d.getTime()) ? "" : d.toISOString();
}

export function PostForm({
  clientId,
  postId,
  campaigns,
  defaultCampaignId,
  defaultDirectorIds = [],
  defaultEditorIds = [],
  defaultValues,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState(defaultValues?.title ?? "");
  const [caption, setCaption] = useState(defaultValues?.caption ?? "");
  const [hashtags, setHashtags] = useState(
    defaultValues?.hashtags?.length ? defaultValues.hashtags.join(" ") : ""
  );
  const [postType, setPostType] = useState<PostType>(
    defaultValues?.post_type ?? "feed"
  );
  const [platform, setPlatform] = useState<PostPlatform>(
    defaultValues?.platform ?? "instagram"
  );
  const [status, setStatus] = useState<PostStatus>(
    defaultValues?.status ?? "draft"
  );
  const [scheduledAt, setScheduledAt] = useState(
    defaultValues?.scheduled_at
      ? defaultValues.scheduled_at.slice(0, 16)
      : ""
  );
  const [campaignId, setCampaignId] = useState<string | null>(
    defaultValues?.campaign_id ?? defaultCampaignId ?? null
  );
  const [mediaUrls, setMediaUrls] = useState<string[]>(
    defaultValues?.media_urls?.length ? defaultValues.media_urls : [""]
  );
  const [assignableUsers, setAssignableUsers] = useState<{ id: string; full_name: string; email: string }[]>([]);
  const [directorIds, setDirectorIds] = useState<string[]>(defaultDirectorIds);
  const [editorIds, setEditorIds] = useState<string[]>(defaultEditorIds);

  useEffect(() => {
    fetch(`/api/clients/${clientId}/assignable-users`)
      .then((res) => (res.ok ? res.json() : { users: [] }))
      .then((data) => setAssignableUsers(data.users ?? []))
      .catch(() => setAssignableUsers([]));
  }, [clientId]);

  useEffect(() => {
    if (postId) return;
    if (!campaignId) {
      setDirectorIds(defaultDirectorIds);
      setEditorIds(defaultEditorIds);
      return;
    }
    fetch(`/api/clients/${clientId}/campaigns/${campaignId}/assignees`)
      .then((res) => (res.ok ? res.json() : { directors: [], editors: [] }))
      .then((data) => {
        setDirectorIds(data.directors ?? []);
        setEditorIds(data.editors ?? []);
      })
      .catch(() => {});
  }, [clientId, campaignId, postId, defaultDirectorIds, defaultEditorIds]);

  const isEdit = !!postId;
  const url = postId
    ? `/api/clients/${clientId}/posts/${postId}`
    : `/api/clients/${clientId}/posts`;

  const buildBody = () => {
    const tagList = hashtags
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((t) => (t.startsWith("#") ? t : `#${t}`));
    const scheduled_at =
      scheduledAt.trim() === "" ? "" : toISO(scheduledAt.trim());
    const urls = mediaUrls.filter((u) => u.trim() !== "");
    return {
      title: title.trim(),
      caption: caption.trim() || undefined,
      hashtags: tagList,
      post_type: postType,
      platform,
      status,
      scheduled_at: scheduled_at || null,
      campaign_id: campaignId || null,
      media_urls: urls,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildBody()),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error?.message ?? "保存に失敗しました。");
        setLoading(false);
        return;
      }
      const newPostId = data.post?.id;
      if (!isEdit && newPostId && (directorIds.length > 0 || editorIds.length > 0)) {
        await fetch(`/api/clients/${clientId}/posts/${newPostId}/assignees`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ directors: directorIds, editors: editorIds }),
        });
      }
      router.push(
        postId ? `/clients/${clientId}/posts/${postId}` : (newPostId ? `/clients/${clientId}/posts/${newPostId}` : `/clients/${clientId}/posts`)
      );
      router.refresh();
    } catch {
      setError("保存に失敗しました。");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="space-y-2">
        <Label htmlFor="title">タイトル *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例: 3月フィード投稿"
          required
        />
      </div>
      {campaigns.length > 0 && (
        <div className="space-y-2">
          <Label>企画</Label>
          <Select
            value={campaignId ?? "none"}
            onValueChange={(v) => setCampaignId(v === "none" ? null : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="企画を選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">なし</SelectItem>
              {campaigns.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>プラットフォーム</Label>
          <Select value={platform} onValueChange={(v) => setPlatform(v as PostPlatform)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {platformOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>投稿種別</Label>
          <Select value={postType} onValueChange={(v) => setPostType(v as PostType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {postTypeOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="caption">キャプション</Label>
        <Textarea
          id="caption"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="本文"
          rows={3}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="hashtags">ハッシュタグ</Label>
        <Input
          id="hashtags"
          value={hashtags}
          onChange={(e) => setHashtags(e.target.value)}
          placeholder="#example #タグ （スペース区切り）"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="scheduled_at">予定日時</Label>
        <Input
          id="scheduled_at"
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>ステータス</Label>
        <Select value={status} onValueChange={(v) => setStatus(v as PostStatus)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2 border-t pt-4">
        <Label>担当者（ディレクター・編集者）</Label>
        <p className="text-muted-foreground text-sm">
          複数人設定できます。{isEdit ? "変更後は「担当者を保存」を押してください。" : "企画を選ぶとその企画の担当者がデフォルトで入ります。"}
        </p>
        {isEdit ? (
          <AssigneesEditor
            key={`post-${postId}`}
            assigneesApiBase={`/api/clients/${clientId}/posts/${postId}`}
            assignableUsers={assignableUsers}
            disabled={loading}
            onSave={() => router.refresh()}
          />
        ) : (
          <AssigneesEditor
            key={`assignees-${campaignId ?? "client"}`}
            assigneesApiBase=""
            assignableUsers={assignableUsers}
            defaultDirectors={directorIds}
            defaultEditors={editorIds}
            disabled={loading}
            onChange={(d, e) => {
              setDirectorIds(d);
              setEditorIds(e);
            }}
          />
        )}
      </div>

      <div className="space-y-2">
        <Label>素材URL（1行1URL）</Label>
        {mediaUrls.map((url, i) => (
          <Input
            key={i}
            value={url}
            onChange={(e) => {
              const next = [...mediaUrls];
              next[i] = e.target.value;
              setMediaUrls(next);
            }}
            placeholder="https://..."
            className="mb-2"
          />
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setMediaUrls([...mediaUrls, ""])}
        >
          URLを追加
        </Button>
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? "保存中…" : isEdit ? "更新" : "作成"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          キャンセル
        </Button>
      </div>
    </form>
  );
}

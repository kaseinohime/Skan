"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Hash, CalendarClock } from "lucide-react";
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
import { CaptionGenerateDialog } from "@/components/ai/caption-generate-dialog";
import { HashtagSuggestDialog } from "@/components/ai/hashtag-suggest-dialog";
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
  /** プレビュー用。キャプション・ハッシュタグ・種別・プラットフォーム・素材URLの変更時に呼ばれる */
  onValuesChange?: (values: {
    caption: string;
    hashtags: string[];
    post_type: PostType;
    platform: PostPlatform;
    media_urls: string[];
  }) => void;
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
  onValuesChange,
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
  const [captionDialogOpen, setCaptionDialogOpen] = useState(false);
  const [hashtagDialogOpen, setHashtagDialogOpen] = useState(false);
  const isDirtyRef = useRef(false);
  const [aiUsage, setAiUsage] = useState<{ remaining: number; limit: number; windowLabel: string } | null>(null);

  // 新規作成時のみ自動保存キー（編集時はスキップ）
  const draftKey = postId ? null : `draft_post_${clientId}`;
  const [showDraftBanner, setShowDraftBanner] = useState(false);

  // AI使用残り回数を取得
  useEffect(() => {
    fetch("/api/ai/usage")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setAiUsage({
            remaining: data.caption.remaining,
            limit: data.caption.limit,
            windowLabel: data.windowLabel,
          });
        }
      })
      .catch(() => {});
  }, []);

  // 下書き復元バナー（新規作成時のみ）
  useEffect(() => {
    if (!draftKey) return;
    const saved = localStorage.getItem(draftKey);
    if (saved) setShowDraftBanner(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const restoreDraft = () => {
    if (!draftKey) return;
    try {
      const saved = localStorage.getItem(draftKey);
      if (!saved) return;
      const d = JSON.parse(saved) as {
        title?: string; caption?: string; hashtags?: string;
        post_type?: PostType; platform?: PostPlatform; scheduled_at?: string;
        campaign_id?: string | null; media_urls?: string[];
      };
      if (d.title !== undefined) setTitle(d.title);
      if (d.caption !== undefined) setCaption(d.caption);
      if (d.hashtags !== undefined) setHashtags(d.hashtags);
      if (d.post_type !== undefined) setPostType(d.post_type);
      if (d.platform !== undefined) setPlatform(d.platform);
      if (d.scheduled_at !== undefined) setScheduledAt(d.scheduled_at);
      if (d.campaign_id !== undefined) setCampaignId(d.campaign_id);
      if (d.media_urls !== undefined) setMediaUrls(d.media_urls.length ? d.media_urls : [""]);
      isDirtyRef.current = true;
    } catch {}
    setShowDraftBanner(false);
  };

  const discardDraft = () => {
    if (draftKey) localStorage.removeItem(draftKey);
    setShowDraftBanner(false);
  };

  // フォーム変更時にlocalStorageへ自動保存（1秒デバウンス、新規作成のみ）
  useEffect(() => {
    if (!draftKey) return;
    if (!isDirtyRef.current) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(draftKey, JSON.stringify({
          title, caption, hashtags,
          post_type: postType, platform,
          scheduled_at: scheduledAt,
          campaign_id: campaignId,
          media_urls: mediaUrls,
        }));
      } catch {}
    }, 1000);
    return () => clearTimeout(timer);
  }, [draftKey, title, caption, hashtags, postType, platform, scheduledAt, campaignId, mediaUrls]);

  // 編集中に離脱しようとした場合に確認ダイアログを表示
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!isDirtyRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

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

  useEffect(() => {
    if (!onValuesChange) return;
    const tagList = hashtags.trim().split(/\s+/).filter(Boolean);
    onValuesChange({
      caption,
      hashtags: tagList,
      post_type: postType,
      platform,
      media_urls: mediaUrls.filter((u) => u.trim() !== ""),
    });
  }, [caption, hashtags, postType, platform, mediaUrls, onValuesChange]);

  const saveAndCreateAnotherRef = useRef(false);
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
      isDirtyRef.current = false;
      if (draftKey) localStorage.removeItem(draftKey);
      if (!isEdit && saveAndCreateAnotherRef.current) {
        saveAndCreateAnotherRef.current = false;
        router.push(`/clients/${clientId}/posts/new`);
        router.refresh();
      } else {
        router.push(
          postId ? `/clients/${clientId}/posts/${postId}` : (newPostId ? `/clients/${clientId}/posts/${newPostId}` : `/clients/${clientId}/posts`)
        );
        router.refresh();
      }
    } catch {
      setError("保存に失敗しました。");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 下書き復元バナー */}
      {showDraftBanner && (
        <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
          <p className="text-sm text-blue-800">
            前回の入力途中の下書きが見つかりました。復元しますか？
          </p>
          <div className="flex gap-2 ml-3 shrink-0">
            <button
              type="button"
              onClick={discardDraft}
              className="text-xs text-blue-600 hover:underline"
            >
              破棄
            </button>
            <button
              type="button"
              onClick={restoreDraft}
              className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
            >
              復元する
            </button>
          </div>
        </div>
      )}
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
          onChange={(e) => { isDirtyRef.current = true; setTitle(e.target.value); }}
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
      {/* AI残り回数バナー */}
      {aiUsage && (
        <div className={`flex items-center gap-2 rounded-md border px-3 py-2 text-xs ${
          aiUsage.remaining === 0
            ? "border-red-300 bg-red-50 text-red-700"
            : aiUsage.remaining <= 3
            ? "border-amber-300 bg-amber-50 text-amber-700"
            : "border-border bg-muted/30 text-muted-foreground"
        }`}>
          <Sparkles className="h-3.5 w-3.5 shrink-0" />
          AI生成：残り <span className="font-semibold">{aiUsage.remaining}</span> 回 / {aiUsage.limit}回
          <span className="ml-1">（{aiUsage.windowLabel}）</span>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="caption">キャプション</Label>
          <span className={`text-xs ${caption.length > 2200 ? "text-red-500 font-medium" : "text-muted-foreground"}`}>
            {caption.length.toLocaleString()} / 2,200文字
          </span>
        </div>
        <div className="flex gap-2">
          <Textarea
            id="caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="本文"
            rows={3}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            title="AIでキャプションを生成"
            onClick={() => setCaptionDialogOpen(true)}
            disabled={aiUsage?.remaining === 0}
          >
            <Sparkles className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="hashtags">ハッシュタグ</Label>
          {(() => {
            const count = hashtags.trim().split(/\s+/).filter(Boolean).length;
            return (
              <span className={`text-xs ${count > 30 ? "text-red-500 font-medium" : "text-muted-foreground"}`}>
                {count} / 30個
              </span>
            );
          })()}
        </div>
        <div className="flex gap-2">
          <Input
            id="hashtags"
            value={hashtags}
            onChange={(e) => setHashtags(e.target.value)}
            placeholder="#example #タグ （スペース区切り）"
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            title="ハッシュタグを提案"
            onClick={() => setHashtagDialogOpen(true)}
            disabled={aiUsage?.remaining === 0}
          >
            <Hash className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 予定日時（目立たせる） */}
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
        <Label htmlFor="scheduled_at" className="flex items-center gap-2 font-semibold">
          <CalendarClock className="h-4 w-4 text-primary" />
          公開予定日時
        </Label>
        <Input
          id="scheduled_at"
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          className="bg-background"
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
      <div className="flex flex-wrap gap-2 pt-2">
        <Button type="submit" disabled={loading} onClick={() => { saveAndCreateAnotherRef.current = false; }}>
          {loading ? "保存中…" : isEdit ? "更新" : "作成"}
        </Button>
        {!isEdit && (
          <Button
            type="submit"
            variant="outline"
            disabled={loading}
            onClick={() => { saveAndCreateAnotherRef.current = true; }}
          >
            保存して次を作成
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          disabled={loading}
        >
          キャンセル
        </Button>
      </div>

      <CaptionGenerateDialog
        open={captionDialogOpen}
        onClose={() => setCaptionDialogOpen(false)}
        onSelect={(text) => setCaption(text)}
        platform={platform}
        postType={postType}
        referenceText={caption}
      />
      <HashtagSuggestDialog
        open={hashtagDialogOpen}
        onClose={() => setHashtagDialogOpen(false)}
        caption={caption}
        onAdd={(tags) => {
          const current = hashtags.trim().split(/\s+/).filter(Boolean);
          const combined = [...current, ...tags];
          setHashtags(combined.join(" "));
        }}
      />
    </form>
  );
}

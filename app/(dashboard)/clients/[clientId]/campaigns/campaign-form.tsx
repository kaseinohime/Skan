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
import type { CampaignStatus } from "@/types";

const statusOptions: { value: CampaignStatus; label: string }[] = [
  { value: "active", label: "進行中" },
  { value: "completed", label: "完了" },
  { value: "archived", label: "アーカイブ" },
];

type Props = {
  clientId: string;
  defaultValues?: {
    name: string;
    description: string;
    start_date: string;
    end_date: string;
    status: CampaignStatus;
  };
  campaignId?: string;
  /** 新規作成時: クライアントの担当者をデフォルトで引き継ぐ */
  defaultDirectorIds?: string[];
  defaultEditorIds?: string[];
};

export function CampaignForm({
  clientId,
  defaultValues,
  campaignId,
  defaultDirectorIds = [],
  defaultEditorIds = [],
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(defaultValues?.name ?? "");
  const [description, setDescription] = useState(defaultValues?.description ?? "");
  const [startDate, setStartDate] = useState(defaultValues?.start_date ?? "");
  const [endDate, setEndDate] = useState(defaultValues?.end_date ?? "");
  const [status, setStatus] = useState<CampaignStatus>(defaultValues?.status ?? "active");
  const [assignableUsers, setAssignableUsers] = useState<{ id: string; full_name: string; email: string }[]>([]);
  const [directorIds, setDirectorIds] = useState<string[]>(defaultDirectorIds);
  const [editorIds, setEditorIds] = useState<string[]>(defaultEditorIds);

  useEffect(() => {
    fetch(`/api/clients/${clientId}/assignable-users`)
      .then((res) => (res.ok ? res.json() : { users: [] }))
      .then((data) => setAssignableUsers(data.users ?? []))
      .catch(() => setAssignableUsers([]));
  }, [clientId]);

  const isEdit = !!campaignId;
  const url = campaignId
    ? `/api/clients/${clientId}/campaigns/${campaignId}`
    : `/api/clients/${clientId}/campaigns`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const body = {
        name: name.trim(),
        description: description.trim() || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        status,
      };
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error?.message ?? "保存に失敗しました。");
        setLoading(false);
        return;
      }
      const newCampaignId = isEdit ? campaignId : data.campaign?.id;
      if (!isEdit && newCampaignId && (directorIds.length > 0 || editorIds.length > 0)) {
        await fetch(`/api/clients/${clientId}/campaigns/${newCampaignId}/assignees`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ directors: directorIds, editors: editorIds }),
        });
      }
      router.push(`/clients/${clientId}/campaigns${newCampaignId ? `/${newCampaignId}` : ""}`);
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
        <Label htmlFor="name">企画名 *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例: 春キャンペーン"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">説明</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="企画の概要"
          rows={3}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_date">開始日</Label>
          <Input
            id="start_date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end_date">終了日</Label>
          <Input
            id="end_date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>ステータス</Label>
        <Select value={status} onValueChange={(v) => setStatus(v as CampaignStatus)}>
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
          複数人設定できます。{isEdit ? "変更後は「担当者を保存」を押してください。" : "新規作成時はクライアントの担当者がデフォルトで入ります。"}
        </p>
        {isEdit ? (
          <AssigneesEditor
            assigneesApiBase={`/api/clients/${clientId}/campaigns/${campaignId}`}
            assignableUsers={assignableUsers}
            disabled={loading}
            onSave={() => router.refresh()}
          />
        ) : (
          <AssigneesEditor
            assigneesApiBase=""
            assignableUsers={assignableUsers}
            defaultDirectors={defaultDirectorIds}
            defaultEditors={defaultEditorIds}
            disabled={loading}
            onChange={(d, e) => {
              setDirectorIds(d);
              setEditorIds(e);
            }}
          />
        )}
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

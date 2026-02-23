"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

type UserOption = { id: string; full_name: string; email: string };

type Props = {
  /** 例: /api/clients/xxx または /api/clients/xxx/campaigns/yyy または /api/clients/xxx/posts/yyy。新規の場合は空でOK（defaultDirectors/Editors で表示） */
  assigneesApiBase: string;
  assignableUsers: UserOption[];
  /** 新規作成時に親から引き継ぐデフォルト（企画ならクライアントの担当者、投稿なら企画 or クライアント） */
  defaultDirectors?: string[];
  defaultEditors?: string[];
  disabled?: boolean;
  onSave?: () => void;
  /** 新規作成時: 親が担当者を保存するために変更を受け取る */
  onChange?: (directors: string[], editors: string[]) => void;
};

export function AssigneesEditor({
  assigneesApiBase,
  assignableUsers,
  defaultDirectors = [],
  defaultEditors = [],
  disabled = false,
  onSave,
  onChange,
}: Props) {
  const [directors, setDirectors] = useState<string[]>(defaultDirectors);
  const [editors, setEditors] = useState<string[]>(defaultEditors);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const hasAssigneesEndpoint = !!assigneesApiBase;

  useEffect(() => {
    if (!hasAssigneesEndpoint) {
      setDirectors(defaultDirectors);
      setEditors(defaultEditors);
      setLoading(false);
      return;
    }
    fetch(`${assigneesApiBase}/assignees`)
      .then((res) => (res.ok ? res.json() : { directors: [], editors: [] }))
      .then((data) => {
        setDirectors(data.directors ?? []);
        setEditors(data.editors ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [assigneesApiBase, hasAssigneesEndpoint, defaultDirectors, defaultEditors]);

  const notifyChange = (d: string[], e: string[]) => onChange?.(d, e);

  const addDirector = (userId: string) => {
    if (userId && !directors.includes(userId)) {
      const d = [...directors, userId];
      setDirectors(d);
      notifyChange(d, editors);
    }
  };
  const removeDirector = (userId: string) => {
    const d = directors.filter((id) => id !== userId);
    setDirectors(d);
    notifyChange(d, editors);
  };
  const addEditor = (userId: string) => {
    if (userId && !editors.includes(userId)) {
      const e = [...editors, userId];
      setEditors(e);
      notifyChange(directors, e);
    }
  };
  const removeEditor = (userId: string) => {
    const e = editors.filter((id) => id !== userId);
    setEditors(e);
    notifyChange(directors, e);
  };

  const saveAssignees = async () => {
    if (!hasAssigneesEndpoint) return;
    setSaving(true);
    try {
      const res = await fetch(`${assigneesApiBase}/assignees`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ directors, editors }),
      });
      if (res.ok) onSave?.();
    } finally {
      setSaving(false);
    }
  };

  const userMap = new Map(assignableUsers.map((u) => [u.id, u]));
  const directorOptions = assignableUsers.filter((u) => !directors.includes(u.id));
  const editorOptions = assignableUsers.filter((u) => !editors.includes(u.id));

  if (loading) return <p className="text-muted-foreground text-sm">読み込み中…</p>;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>ディレクター</Label>
        <div className="flex flex-wrap gap-2">
          {directors.map((id) => {
            const u = userMap.get(id);
            return (
              <Badge key={id} variant="secondary" className="gap-1 pr-1">
                {u?.full_name ?? id}
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => removeDirector(id)}
                    className="rounded-full hover:bg-muted-foreground/20 p-0.5"
                    aria-label="削除"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            );
          })}
        </div>
        {!disabled && directorOptions.length > 0 && (
          <Select onValueChange={addDirector} value="">
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue placeholder="ディレクターを追加" />
            </SelectTrigger>
            <SelectContent>
              {directorOptions.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.full_name}（{u.email}）
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="space-y-2">
        <Label>編集者</Label>
        <div className="flex flex-wrap gap-2">
          {editors.map((id) => {
            const u = userMap.get(id);
            return (
              <Badge key={id} variant="outline" className="gap-1 pr-1">
                {u?.full_name ?? id}
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => removeEditor(id)}
                    className="rounded-full hover:bg-muted-foreground/20 p-0.5"
                    aria-label="削除"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            );
          })}
        </div>
        {!disabled && editorOptions.length > 0 && (
          <Select onValueChange={addEditor} value="">
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue placeholder="編集者を追加" />
            </SelectTrigger>
            <SelectContent>
              {editorOptions.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.full_name}（{u.email}）
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {hasAssigneesEndpoint && onSave && (
        <button
          type="button"
          onClick={saveAssignees}
          disabled={saving}
          className="text-primary text-sm hover:underline"
        >
          {saving ? "保存中…" : "担当者を保存"}
        </button>
      )}
    </div>
  );
}

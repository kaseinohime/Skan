"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, GripVertical } from "lucide-react";
import type { ApprovalTemplate, ApprovalStep } from "@/types";

type UserOption = { id: string; full_name: string; email: string };

type StepForm = { name: string; required_role: "staff" | "agency_admin" | "client"; assigned_to: string | null };

export function ApprovalFlowEditor({ orgId }: { orgId: string }) {
  const [templates, setTemplates] = useState<(ApprovalTemplate & { steps?: ApprovalStep[] })[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [formName, setFormName] = useState("");
  const [formDefault, setFormDefault] = useState(false);
  const [formSteps, setFormSteps] = useState<StepForm[]>([{ name: "ステップ1", required_role: "staff", assigned_to: null }]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchData = useCallback(async () => {
    const [tRes, uRes] = await Promise.all([
      fetch(`/api/organizations/${orgId}/approval-templates`),
      fetch(`/api/organizations/${orgId}/assignable-users`),
    ]);
    const tData = tRes.ok ? await tRes.json().catch(() => ({})) : {};
    const uData = uRes.ok ? await uRes.json().catch(() => ({})) : {};
    setTemplates(tData.templates ?? []);
    setUsers(uData.users ?? []);
    setLoading(false);
  }, [orgId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const startCreate = () => {
    setCreating(true);
    setEditingId(null);
    setFormName("");
    setFormDefault(false);
    setFormSteps([{ name: "ステップ1", required_role: "staff", assigned_to: null }]);
    setMessage(null);
  };

  const startEdit = (t: ApprovalTemplate & { steps?: ApprovalStep[] }) => {
    setEditingId(t.id);
    setCreating(false);
    setFormName(t.name);
    setFormDefault(t.is_default);
    setFormSteps(
      (t.steps ?? []).length > 0
        ? (t.steps ?? []).map((s) => ({
            name: s.name,
            required_role: s.required_role as "staff" | "agency_admin" | "client",
            assigned_to: s.assigned_to,
          }))
        : [{ name: "ステップ1", required_role: "staff", assigned_to: null }]
    );
    setMessage(null);
  };

  const cancelForm = () => {
    setCreating(false);
    setEditingId(null);
    setMessage(null);
  };

  const addStep = () => {
    setFormSteps((prev) => [...prev, { name: `ステップ${prev.length + 1}`, required_role: "staff", assigned_to: null }]);
  };

  const removeStep = (index: number) => {
    setFormSteps((prev) => prev.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, field: keyof StepForm, value: string | null) => {
    setFormSteps((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value ?? null } : s))
    );
  };

  const save = async () => {
    if (!formName.trim()) {
      setMessage({ type: "error", text: "テンプレート名を入力してください。" });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const steps = formSteps.map((s, i) => ({
        name: s.name.trim() || `ステップ${i + 1}`,
        required_role: s.required_role,
        assigned_to: s.assigned_to,
      }));
      if (editingId) {
        const res = await fetch(`/api/organizations/${orgId}/approval-templates/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: formName.trim(), is_default: formDefault, steps }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setMessage({ type: "error", text: data.error?.message ?? "更新に失敗しました。" });
          return;
        }
        setMessage({ type: "success", text: "テンプレートを更新しました。" });
      } else {
        const res = await fetch(`/api/organizations/${orgId}/approval-templates`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: formName.trim(), is_default: formDefault, steps }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setMessage({ type: "error", text: data.error?.message ?? "作成に失敗しました。" });
          return;
        }
        setMessage({ type: "success", text: "テンプレートを作成しました。" });
      }
      await fetchData();
      cancelForm();
    } finally {
      setSaving(false);
    }
  };

  const deleteTemplate = async (templateId: string) => {
    if (!confirm("このテンプレートを削除しますか？")) return;
    const res = await fetch(`/api/organizations/${orgId}/approval-templates/${templateId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMessage({ type: "error", text: data.error?.message ?? "削除に失敗しました。" });
      return;
    }
    setMessage({ type: "success", text: "テンプレートを削除しました。" });
    await fetchData();
    if (editingId === templateId) cancelForm();
  };

  if (loading) {
    return <p className="text-muted-foreground">読み込み中…</p>;
  }

  const roleLabel: Record<string, string> = {
    staff: "スタッフ",
    agency_admin: "企業管理者",
    client: "クライアント",
  };

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`rounded-md border p-3 text-sm ${
            message.type === "error" ? "border-destructive/50 bg-destructive/10 text-destructive" : "border-emerald-500/50 bg-emerald-500/10 text-emerald-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>承認テンプレート</CardTitle>
          <CardDescription>
            承認ステップを定義します。デフォルトに設定したテンプレートが投稿の承認フローに使われます。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={startCreate} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            新規テンプレート
          </Button>

          {templates.length === 0 && !creating && !editingId ? (
            <p className="text-muted-foreground text-sm">テンプレートがありません。新規作成してください。</p>
          ) : (
            <ul className="space-y-2">
              {templates.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{t.name}</span>
                    {t.is_default && (
                      <Badge variant="secondary" className="text-xs">
                        デフォルト
                      </Badge>
                    )}
                    <span className="text-muted-foreground text-sm">
                      （{(t.steps ?? []).length} ステップ）
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEdit(t)}
                      disabled={!!creating}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteTemplate(t.id)}
                      disabled={!!creating}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {(creating || editingId) && (
            <Card className="mt-6 border-2">
              <CardHeader>
                <CardTitle>{editingId ? "テンプレートを編集" : "新規テンプレート"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="template-name">テンプレート名</Label>
                  <Input
                    id="template-name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="例: 標準フロー"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is-default"
                    checked={formDefault}
                    onChange={(e) => setFormDefault(e.target.checked)}
                    className="h-4 w-4 rounded border-input"
                  />
                  <Label htmlFor="is-default">デフォルトテンプレートにする</Label>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <Label>承認ステップ</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addStep}>
                      <Plus className="mr-1 h-3 w-3" />
                      ステップを追加
                    </Button>
                  </div>
                  <ul className="space-y-3">
                    {formSteps.map((step, index) => (
                      <li
                        key={index}
                        className="flex flex-wrap items-center gap-2 rounded border bg-background p-3"
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <Input
                          className="w-40"
                          value={step.name}
                          onChange={(e) => updateStep(index, "name", e.target.value)}
                          placeholder="ステップ名"
                        />
                        <Select
                          value={step.required_role}
                          onValueChange={(v) => updateStep(index, "required_role", v)}
                        >
                          <SelectTrigger className="w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="staff">{roleLabel.staff}</SelectItem>
                            <SelectItem value="agency_admin">{roleLabel.agency_admin}</SelectItem>
                            <SelectItem value="client">{roleLabel.client}</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select
                          value={step.assigned_to ?? "none"}
                          onValueChange={(v) => updateStep(index, "assigned_to", v === "none" ? null : v)}
                        >
                          <SelectTrigger className="w-44">
                            <SelectValue placeholder="担当者（任意）" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">未指定</SelectItem>
                            {users.map((u) => (
                              <SelectItem key={u.id} value={u.id}>
                                {u.full_name} ({u.email})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeStep(index)}
                          disabled={formSteps.length <= 1}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={save} disabled={saving}>
                    {saving ? "保存中…" : "保存"}
                  </Button>
                  <Button variant="outline" onClick={cancelForm} disabled={saving}>
                    キャンセル
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

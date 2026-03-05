"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Loader2 } from "lucide-react";

type SectionState = {
  saving: boolean;
  saved: boolean;
  error: string | null;
};

const initial: SectionState = { saving: false, saved: false, error: null };

export function AccountForm({
  initialName,
  initialEmail,
}: {
  initialName: string;
  initialEmail: string;
}) {
  const supabase = createClient();

  // 表示名
  const [name, setName] = useState(initialName);
  const [nameState, setNameState] = useState<SectionState>(initial);

  // メールアドレス
  const [email, setEmail] = useState(initialEmail);
  const [emailState, setEmailState] = useState<SectionState>(initial);

  // パスワード
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordState, setPasswordState] = useState<SectionState>(initial);

  /** 表示名を保存 */
  const saveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setNameState({ saving: true, saved: false, error: null });
    const { error } = await supabase
      .from("users")
      .update({ full_name: name.trim() })
      .eq("id", (await supabase.auth.getUser()).data.user?.id ?? "");
    if (error) {
      setNameState({ saving: false, saved: false, error: "保存に失敗しました" });
    } else {
      setNameState({ saving: false, saved: true, error: null });
      setTimeout(() => setNameState(initial), 3000);
    }
  };

  /** メールアドレスを変更 */
  const saveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || email.trim() === initialEmail) return;
    setEmailState({ saving: true, saved: false, error: null });
    const { error } = await supabase.auth.updateUser({ email: email.trim() });
    if (error) {
      setEmailState({ saving: false, saved: false, error: error.message });
    } else {
      setEmailState({ saving: false, saved: true, error: null });
      // usersテーブルのemailも更新（即時反映）
      await supabase
        .from("users")
        .update({ email: email.trim() })
        .eq("id", (await supabase.auth.getUser()).data.user?.id ?? "");
    }
  };

  /** パスワードを変更 */
  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) return;
    if (newPassword !== confirmPassword) {
      setPasswordState({ saving: false, saved: false, error: "新しいパスワードが一致しません" });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordState({ saving: false, saved: false, error: "パスワードは8文字以上で入力してください" });
      return;
    }
    setPasswordState({ saving: true, saved: false, error: null });
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPasswordState({ saving: false, saved: false, error: error.message });
    } else {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordState({ saving: false, saved: true, error: null });
      setTimeout(() => setPasswordState(initial), 3000);
    }
  };

  return (
    <div className="space-y-4">
      {/* 表示名 */}
      <div className="rounded-2xl border border-border/60 bg-white/60 backdrop-blur-md p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-foreground">表示名</h2>
        <form onSubmit={saveName} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">氏名・ニックネーム</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="山田 太郎"
              disabled={nameState.saving}
              className="rounded-xl"
            />
          </div>
          {nameState.error && <p className="text-sm text-red-600">{nameState.error}</p>}
          <div className="flex items-center gap-3">
            {nameState.saved && (
              <span className="flex items-center gap-1 text-sm text-emerald-600">
                <Check className="h-4 w-4" />
                保存しました
              </span>
            )}
            <Button type="submit" disabled={nameState.saving} className="ml-auto rounded-xl">
              {nameState.saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              保存する
            </Button>
          </div>
        </form>
      </div>

      {/* メールアドレス */}
      <div className="rounded-2xl border border-border/60 bg-white/60 backdrop-blur-md p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-foreground">メールアドレス</h2>
        <form onSubmit={saveEmail} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">新しいメールアドレス</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={emailState.saving}
              className="rounded-xl"
            />
          </div>
          {emailState.error && <p className="text-sm text-red-600">{emailState.error}</p>}
          {emailState.saved && (
            <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              確認メールを送信しました。新しいメールアドレス宛のリンクをクリックして変更を完了してください。
            </p>
          )}
          {!emailState.saved && (
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={emailState.saving || email.trim() === initialEmail}
                className="rounded-xl"
              >
                {emailState.saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                変更する
              </Button>
            </div>
          )}
        </form>
      </div>

      {/* パスワード */}
      <div className="rounded-2xl border border-border/60 bg-white/60 backdrop-blur-md p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-foreground">パスワード変更</h2>
        <form onSubmit={savePassword} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="new-password">新しいパスワード</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="8文字以上"
              disabled={passwordState.saving}
              className="rounded-xl"
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-password">新しいパスワード（確認）</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="もう一度入力"
              disabled={passwordState.saving}
              className="rounded-xl"
              autoComplete="new-password"
            />
          </div>
          {passwordState.error && <p className="text-sm text-red-600">{passwordState.error}</p>}
          <div className="flex items-center gap-3">
            {passwordState.saved && (
              <span className="flex items-center gap-1 text-sm text-emerald-600">
                <Check className="h-4 w-4" />
                パスワードを変更しました
              </span>
            )}
            <Button
              type="submit"
              disabled={passwordState.saving || !newPassword || !confirmPassword}
              className="ml-auto rounded-xl"
            >
              {passwordState.saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              変更する
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

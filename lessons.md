# lessons.md - エスカン 教訓記録

> エラーや試行錯誤から学んだ教訓を記録し、同じミスを防ぐための自己改善ループ。

## 記録フォーマット

```
### [日付] カテゴリ: タイトル
- **問題**: 何が起きたか
- **原因**: なぜ起きたか
- **解決策**: どう解決したか
- **教訓**: 次回から何に気をつけるか
```

---

## カテゴリ一覧

- **DB**: データベース・スキーマ・マイグレーション関連
- **Auth**: 認証・認可・RLS関連
- **UI**: フロントエンド・コンポーネント・スタイリング関連
- **API**: APIルート・サーバーサイドロジック関連
- **Deploy**: デプロイ・環境設定関連
- **AI**: AI機能・OpenAI API関連
- **General**: その他全般

---

## 教訓一覧

### 2026-02-23 Auth: 招待後の /register で「Auth session missing!」エラー
- **問題**: 招待メールクリック → `/auth/confirm` → `/register` でパスワード設定時に「Auth session missing!」
- **原因1**: `/auth/confirm` で `verifyOtp` 後すぐに `router.replace` → Cookie書き込み完了前にリダイレクト
- **原因2**: `{{ .ConfirmationURL }}` は Supabase サーバー経由で処理後に `#access_token=xxx` ハッシュフラグメント形式でリダイレクトする。Route Handler はサーバーサイドなのでハッシュを受け取れず `token_hash` が null になる
- **解決策**: `/auth/confirm` をクライアントコンポーネントのまま維持し、以下の2パターンに対応:
  1. `token_hash` パラメータあり → `verifyOtp` を呼ぶ
  2. `#access_token=...` ハッシュフラグメントあり → `setSession` を呼ぶ
  いずれも `onAuthStateChange` で `SIGNED_IN` イベントを待ってからリダイレクト（Cookieへの書き込み完了を保証）
- **教訓**: `{{ .ConfirmationURL }}` は implicit flow（ハッシュフラグメント）でリダイレクトするため、Route Handler では処理できない。またセッション確立後のリダイレクトは必ず `onAuthStateChange` で `SIGNED_IN` を待ってから行うこと

<!-- 記録例:
### 2026-02-17 Auth: Supabase Auth の招待メールが届かない
- **問題**: inviteUserByEmail() を呼んでも招待メールが送信されなかった
- **原因**: Supabase ダッシュボードの Auth > Settings で SMTP が未設定だった
- **解決策**: Supabase の Built-in Email を有効化し、カスタムSMTPを設定した
- **教訓**: Supabase Auth のメール機能を使う前に、必ず Email Settings を確認する
-->

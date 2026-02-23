# CLAUDE.md - エスカン プロジェクトルール

> AIエージェントはこのファイルを最初に読み、すべてのルールに従うこと。

## プロジェクト概要

- **プロダクト名**: エスカン
- **種別**: SNS運用代行向けSaaS（ウェブアプリケーション）
- **ターゲット**: SNS運用代行業者（代理店）とそのクライアント企業
- **現在のフェーズ**: Phase 1（MVP）

## 定義書の参照先

実装時は以下の定義書を参照すること。定義書との矛盾がある場合は、定義書を優先する。

| ファイル | 内容 |
|---------|------|
| `docs/PRD.md` | 要件定義（何を作り、何を作らないか） |
| `docs/APP_FLOW.md` | 画面遷移とURL設計 |
| `docs/TECH_STACK.md` | 技術スタックとバージョン |
| `docs/FRONTEND_GUIDELINES.md` | デザインシステム（色、フォント、UIルール） |
| `docs/BACKEND_STRUCTURE.md` | DBスキーマ、API定義、RLS |
| `docs/IMPLEMENTATION_PLAN.md` | 実装のステップバイステップ手順 |

## 技術的な制約・禁止事項

### 絶対に使わないもの
- **Prisma**: 使用禁止。Supabase JavaScript Client (`@supabase/supabase-js`) で直接DB操作する
- **Drizzle ORM**: 同上
- **NextAuth.js / Auth.js**: 使用禁止。Supabase Auth を使う
- **Redux / Zustand**: Phase 1 では使用しない
- **CSS Modules / Styled Components**: Tailwind CSS を使う
- **react-beautiful-dnd**: メンテ停止のため。@dnd-kit/react を使う

### Phase 1 で実装しないもの
- SNS API連携（Instagram Graph API / TikTok API）→ Phase 2
- 画像・動画の編集機能（Canva等の外部ツールに委ねる）
- 広告運用管理
- 炎上監視・アラート
- 多言語対応（日本語のみ）
- ダークモード
- ネイティブモバイルアプリ

### 素材管理
- 画像・動画はSupabase Storageにアップロードしない
- Google Drive のURLを貼り付けて管理する方式
- `media_urls` カラムにGoogle Drive URLの配列を保持

## コーディング規約

### 言語
- コード（変数名、関数名、ファイル名）: **英語**
- UIテキスト（ラベル、メッセージ、プレースホルダー）: **日本語**
- コメント: **日本語**（ただし、非自明なロジックの説明時のみ記述）

### TypeScript
- `strict: true` を維持
- `any` 型の使用は禁止。どうしても必要な場合は `unknown` を使い、型ガードを実装
- Supabase の型は `supabase gen types typescript` で生成した型を使用
- 型定義は `types/` ディレクトリに集約

### ファイル・コンポーネント
- コンポーネントは関数コンポーネント + アロー関数で記述
- `"use client"` は必要なコンポーネントにのみ付与（Server Components をデフォルトとする）
- ファイル名: kebab-case（例: `post-card.tsx`）
- コンポーネント名: PascalCase（例: `PostCard`）
- フック名: camelCase + `use` プレフィックス（例: `usePostData`）

### Supabase
- ブラウザ用クライアント: `lib/supabase/client.ts`
- サーバー用クライアント: `lib/supabase/server.ts`
- Middleware用: `lib/supabase/middleware.ts`
- RLSポリシーは必ずDBマイグレーションに含め、`supabase/migrations/` に配置
- Service Role Key はサーバーサイドのみで使用（ゲストリンクのトークン検証等）

### バリデーション
- Zod スキーマは `lib/validations/` に配置
- サーバーサイドとクライアントサイドで同じスキーマを共有
- フォームは react-hook-form + @hookform/resolvers/zod で統一

### エラーハンドリング
- API Route Handlers では try-catch で包み、統一フォーマットでエラーレスポンスを返す
- クライアントサイドのエラーは Sonner（Toast）で表示
- 予期しないエラーは Sentry 等で追跡（Phase 1 ではコンソール出力でも可）

## ディレクトリ構造ルール

```
app/                    # ルーティング・ページのみ。ビジネスロジックは置かない
components/             # 再利用可能なUIコンポーネント
  ui/                   # shadcn/ui コンポーネント（CLIで追加）
  layout/               # レイアウト系（サイドバー、ヘッダー等）
  [domain]/             # ドメイン別（calendar/, posts/, preview/, approval/）
lib/                    # ユーティリティ、ヘルパー、設定
  supabase/             # Supabaseクライアント設定
  validations/          # Zodスキーマ
hooks/                  # カスタムフック
types/                  # TypeScript型定義
supabase/migrations/    # DBマイグレーション（SQL）
```

## Git ルール

- コミットメッセージは日本語で記述
- プレフィックス: `feat:`, `fix:`, `refactor:`, `style:`, `docs:`, `chore:`
- 例: `feat: 投稿カレンダーのドラッグ＆ドロップ機能を追加`

## セッション管理

- 作業開始時に `progress.txt` を読み、現在の状態を把握すること
- 作業終了時に `progress.txt` を更新すること
- エラーや学んだことがあれば `lessons.md` に追記すること

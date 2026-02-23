# TECH_STACK（技術スタック定義） - エスカン

## 1. 技術スタック一覧

### フレームワーク・ランタイム

| 技術 | バージョン | 用途 |
|------|-----------|------|
| Next.js | 16.1.x | フルスタックReactフレームワーク（App Router） |
| React | 19.x | UIライブラリ |
| TypeScript | 5.7.x | 型安全な開発 |
| Node.js | 22.x LTS | ランタイム |

### バックエンド・データベース

| 技術 | バージョン | 用途 |
|------|-----------|------|
| Supabase | - | BaaS（Auth / Database / Storage / Realtime） |
| @supabase/supabase-js | 2.95.x | Supabase JavaScript クライアント |
| @supabase/ssr | 0.8.x | SSR対応のSupabaseクライアント |
| PostgreSQL | 15.x（Supabase管理） | データベース（Supabase内蔵） |

### UI・スタイリング

| 技術 | バージョン | 用途 |
|------|-----------|------|
| Tailwind CSS | 4.1.x | ユーティリティファーストCSS |
| shadcn/ui | 3.8.x | UIコンポーネントライブラリ（Radix UIベース） |
| Lucide React | 最新 | アイコンライブラリ |
| Noto Sans JP | - | 日本語Webフォント（Google Fonts） |

### ドラッグ＆ドロップ

| 技術 | バージョン | 用途 |
|------|-----------|------|
| @dnd-kit/react | 0.3.x | カレンダーのドラッグ＆ドロップ操作 |

### バリデーション・ユーティリティ

| 技術 | バージョン | 用途 |
|------|-----------|------|
| Zod | 3.x | スキーマバリデーション（フォーム入力・API） |
| date-fns | 4.x | 日付操作・フォーマット |
| react-hook-form | 7.x | フォーム状態管理 |

### AI

| 技術 | バージョン | 用途 |
|------|-----------|------|
| OpenAI API | gpt-4o-mini | キャプション下書き生成（Phase 1） |
| openai (npm) | 4.x | OpenAI Node.js クライアント |

### デプロイ・インフラ

| 技術 | バージョン | 用途 |
|------|-----------|------|
| Vercel | - | ホスティング・デプロイ |
| Supabase Cloud | - | データベース・認証・ストレージ |

### 開発ツール

| 技術 | バージョン | 用途 |
|------|-----------|------|
| ESLint | 9.x | コード品質チェック |
| Prettier | 3.x | コードフォーマッター |
| pnpm | 9.x | パッケージマネージャー |

## 2. 技術選定の理由

### Next.js 16 (App Router)
- Server Components / Server Actions によるサーバーサイドロジックの統合
- App Router によるレイアウト・ローディング・エラーハンドリングの統一
- Middleware によるロールベース認証の実装
- ISR / SSR / CSR を画面単位で最適化可能

### Supabase（Prismaを使わない理由）
- Supabase JavaScript Client で直接DB操作を行う
- Row Level Security (RLS) によるセキュリティをDB層で担保
- Supabase Auth との統合がシームレス
- Realtime 機能でリアルタイム通知を実現
- ORMレイヤーを挟まないことで、RLSポリシーとの整合性を確保しやすい

### Tailwind CSS 4 + shadcn/ui
- shadcn/ui はコンポーネントをプロジェクトにコピーする方式のため、カスタマイズ性が高い
- Radix UIベースでアクセシビリティ対応済み
- Tailwind CSS 4 の新しいCSS-firstの設定方式

### @dnd-kit/react
- React 19対応の軽量D&Dライブラリ
- カレンダーでの投稿ドラッグ＆ドロップに使用
- アクセシビリティ対応

### Zod + react-hook-form
- 型安全なフォームバリデーション
- サーバーサイド・クライアントサイドでバリデーションスキーマを共有

## 3. 使わない技術（明示的な除外）

| 技術 | 理由 |
|------|------|
| Prisma | Supabase Client + RLSで直接操作する方針のため不要 |
| Drizzle ORM | 同上 |
| NextAuth.js | Supabase Auth を使用するため不要 |
| Styled Components / CSS Modules | Tailwind CSS を採用するため不要 |
| Redux / Zustand | Server Components + Supabase Realtime で状態管理を行うため、Phase 1 では不要 |
| react-beautiful-dnd | メンテナンス停止のため @dnd-kit を採用 |
| MongoDB | Supabase (PostgreSQL) を使用するため不要 |

## 4. 環境変数

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...

# OpenAI
OPENAI_API_KEY=sk-...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 5. プロジェクト構造

```
skan/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # 認証関連ページ
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   ├── (dashboard)/              # 認証済みページ
│   │   ├── master/               # マスター画面
│   │   ├── dashboard/            # 企業管理者ダッシュボード
│   │   ├── clients/              # クライアント管理
│   │   │   └── [clientId]/       # ワークスペース
│   │   │       ├── calendar/
│   │   │       ├── campaigns/
│   │   │       ├── posts/
│   │   │       └── team/
│   │   ├── staff/                # スタッフ管理
│   │   ├── approval/             # 承認画面
│   │   └── settings/             # 設定
│   ├── shared/                   # ゲスト共有ページ
│   │   └── [token]/
│   ├── api/                      # API Route Handlers
│   │   ├── ai/                   # AI関連API
│   │   └── webhooks/             # Webhooks
│   ├── layout.tsx
│   └── page.tsx
├── components/                   # 共通コンポーネント
│   ├── ui/                       # shadcn/ui コンポーネント
│   ├── layout/                   # レイアウトコンポーネント
│   ├── calendar/                 # カレンダー関連
│   ├── posts/                    # 投稿関連
│   ├── preview/                  # プレビュー関連
│   └── approval/                 # 承認関連
├── lib/                          # ユーティリティ
│   ├── supabase/                 # Supabaseクライアント設定
│   │   ├── client.ts             # ブラウザ用クライアント
│   │   ├── server.ts             # サーバー用クライアント
│   │   └── middleware.ts         # Middleware用クライアント
│   ├── validations/              # Zodスキーマ
│   ├── utils.ts                  # ユーティリティ関数
│   └── constants.ts              # 定数
├── types/                        # TypeScript型定義
│   ├── database.ts               # Supabase生成型
│   └── index.ts
├── hooks/                        # カスタムフック
├── public/                       # 静的ファイル
├── docs/                         # ドキュメント
├── supabase/                     # Supabase設定
│   ├── migrations/               # DBマイグレーション
│   └── seed.sql                  # シードデータ
├── CLAUDE.md
├── progress.txt
├── lessons.md
├── package.json
├── tsconfig.json
├── next.config.ts
└── tailwind.config.ts
```

## 6. パッケージインストールコマンド

```bash
# プロジェクト作成
pnpm create next-app@latest skan --typescript --tailwind --eslint --app --src-dir=false

# Supabase
pnpm add @supabase/supabase-js @supabase/ssr

# UI
pnpm dlx shadcn@latest init
pnpm add lucide-react

# ドラッグ＆ドロップ
pnpm add @dnd-kit/react

# バリデーション・フォーム
pnpm add zod react-hook-form @hookform/resolvers

# 日付
pnpm add date-fns

# AI
pnpm add openai

# 開発ツール
pnpm add -D prettier eslint-config-prettier
```

# APP_FLOW（画面遷移・決定フロー） - エスカン

## 1. 全体画面マップ

```mermaid
graph TB
    subgraph auth [認証]
        Login[ログイン]
        Register[アカウント登録]
        ForgotPW[パスワードリセット]
    end

    subgraph master [マスター画面]
        M_Dashboard[マスターダッシュボード]
        M_OrgList[企業一覧]
        M_OrgDetail[企業詳細]
        M_OrgCreate[企業作成]
        M_UserList[全ユーザー一覧]
    end

    subgraph agency [企業管理者画面]
        A_Dashboard[企業ダッシュボード]
        A_ClientList[クライアント一覧]
        A_ClientCreate[クライアント作成]
        A_ClientDetail[クライアント詳細]
        A_StaffList[スタッフ一覧]
        A_StaffInvite[スタッフ招待]
        A_Settings[企業設定]
        A_ApprovalTemplate[承認フローテンプレート]
    end

    subgraph workspace [ワークスペース画面（共通）]
        W_Dashboard[ワークスペースダッシュボード]
        W_Calendar[カレンダー]
        W_CampaignList[企画一覧]
        W_CampaignDetail[企画詳細]
        W_PostCreate[投稿作成]
        W_PostDetail[投稿詳細]
        W_PostPreview[投稿プレビュー]
        W_PostReview[修正指示・コメント]
        W_TeamList[チームメンバー一覧]
        W_AIAssist[AIキャプション生成]
    end

    subgraph client [クライアント画面]
        C_Dashboard[クライアントダッシュボード]
        C_ApprovalList[承認待ち一覧]
        C_PostView[投稿確認・承認]
    end

    subgraph guest [ゲスト画面]
        G_SharedView[共有リンク閲覧]
    end

    Login --> M_Dashboard
    Login --> A_Dashboard
    Login --> W_Dashboard
    Login --> C_Dashboard

    M_Dashboard --> M_OrgList
    M_OrgList --> M_OrgDetail
    M_OrgList --> M_OrgCreate

    A_Dashboard --> A_ClientList
    A_ClientList --> A_ClientCreate
    A_ClientList --> A_ClientDetail
    A_ClientDetail --> W_Dashboard

    W_Dashboard --> W_Calendar
    W_Dashboard --> W_CampaignList
    W_CampaignList --> W_CampaignDetail
    W_CampaignDetail --> W_PostCreate
    W_Calendar --> W_PostCreate
    W_PostCreate --> W_PostDetail
    W_PostDetail --> W_PostPreview
    W_PostDetail --> W_PostReview
    W_PostCreate --> W_AIAssist

    C_Dashboard --> C_ApprovalList
    C_ApprovalList --> C_PostView
```

## 2. URL設計（ルーティング）

| パス | 画面 | 対象ロール |
|------|------|-----------|
| `/login` | ログイン | 未認証 |
| `/register` | アカウント登録 | 未認証 |
| `/forgot-password` | パスワードリセット | 未認証 |
| `/master` | マスターダッシュボード | マスター |
| `/master/organizations` | 企業一覧 | マスター |
| `/master/organizations/new` | 企業作成 | マスター |
| `/master/organizations/[orgId]` | 企業詳細 | マスター |
| `/master/users` | 全ユーザー一覧 | マスター |
| `/dashboard` | 企業ダッシュボード | 企業管理者 |
| `/clients` | クライアント一覧 | 企業管理者 |
| `/clients/new` | クライアント作成 | 企業管理者 |
| `/clients/[clientId]` | クライアント詳細（ワークスペーストップ） | 企業管理者 / スタッフ |
| `/clients/[clientId]/calendar` | カレンダー | 企業管理者 / スタッフ / クライアント |
| `/clients/[clientId]/campaigns` | 企画一覧 | 企業管理者 / スタッフ / クライアント |
| `/clients/[clientId]/campaigns/[campaignId]` | 企画詳細 | 企業管理者 / スタッフ / クライアント |
| `/clients/[clientId]/posts/new` | 投稿作成 | 企業管理者 / スタッフ |
| `/clients/[clientId]/posts/[postId]` | 投稿詳細 | 企業管理者 / スタッフ / クライアント |
| `/clients/[clientId]/posts/[postId]/preview` | 投稿プレビュー | 全ロール |
| `/clients/[clientId]/posts/[postId]/review` | 修正指示・コメント | 企業管理者 / スタッフ / クライアント |
| `/clients/[clientId]/team` | チームメンバー一覧 | 企業管理者 |
| `/staff` | スタッフ一覧 | 企業管理者 |
| `/staff/invite` | スタッフ招待 | 企業管理者 |
| `/settings` | 企業設定 | 企業管理者 |
| `/settings/approval-flow` | 承認フローテンプレート | 企業管理者 |
| `/approval` | 承認待ち一覧 | クライアント |
| `/shared/[token]` | ゲスト共有リンク閲覧 | ゲスト（未認証可） |

## 3. ロール別画面遷移フロー

### 3-1. マスターのフロー

```mermaid
flowchart LR
    Login[ログイン] --> M_Dash[マスターダッシュボード]
    M_Dash --> OrgList[企業一覧]
    OrgList --> OrgCreate[企業作成]
    OrgCreate -->|"企業管理者アカウント発行"| OrgList
    OrgList --> OrgDetail[企業詳細]
    OrgDetail --> OrgEdit[企業情報編集]
    OrgDetail --> OrgStaff[所属スタッフ確認]
    OrgDetail --> OrgClients[クライアント一覧確認]
    M_Dash --> UserList[全ユーザー一覧]
```

**マスターの主な操作**:
1. ログイン後、マスターダッシュボードへ遷移
2. 企業一覧から新しい企業（代理店）を作成。この際、企業管理者のメールアドレスを入力して招待
3. 各企業の詳細を確認し、所属スタッフやクライアント数を俯瞰

### 3-2. 企業管理者のフロー

```mermaid
flowchart LR
    Login[ログイン] --> A_Dash[企業ダッシュボード]
    A_Dash --> ClientList[クライアント一覧]
    ClientList --> ClientCreate[クライアント作成]
    ClientCreate -->|"クライアント招待メール送信"| ClientList
    ClientList --> ClientDetail[クライアント詳細]
    ClientDetail --> WS[ワークスペース]
    A_Dash --> StaffList[スタッフ一覧]
    StaffList --> StaffInvite[スタッフ招待]
    StaffInvite -->|"招待メール送信"| StaffList
    A_Dash --> Settings[企業設定]
    Settings --> ApprovalTpl[承認フローテンプレート設定]
```

**企業管理者の主な操作**:
1. ログイン後、企業ダッシュボードへ（管理中クライアントの概要表示）
2. クライアント（ワークスペース）を新規作成し、クライアント担当者を招待
3. スタッフを企業に招待し、各クライアントのワークスペースに割り当て
4. 承認フローのテンプレートを設定（企業共通のデフォルトフロー）

### 3-3. スタッフのフロー

```mermaid
flowchart LR
    Login[ログイン] --> S_Dash[ワークスペース選択]
    S_Dash --> WS[ワークスペースダッシュボード]
    WS --> Calendar[カレンダー]
    WS --> CampList[企画一覧]
    CampList --> CampDetail[企画詳細]
    CampDetail --> PostCreate[投稿作成]
    Calendar --> PostCreate
    PostCreate --> AI[AIキャプション生成]
    AI --> PostCreate
    PostCreate --> PostDetail[投稿詳細]
    PostDetail --> Preview[プレビュー]
    PostDetail --> Review[修正指示確認]
    Review -->|"修正対応"| PostDetail
    PostDetail -->|"承認申請"| StatusChange[ステータス変更]
```

**スタッフの主な操作**:
1. ログイン後、所属ワークスペースの一覧から作業先を選択
2. カレンダーまたは企画一覧から投稿を作成
3. AIアシスタントでキャプションの下書きを生成
4. 素材のGoogle Drive URLを貼り付け
5. プレビューで仕上がりを確認
6. 承認申請（ステータスを「承認待ち」に変更）
7. クライアントからの修正指示を確認し、対応

### 3-4. クライアントのフロー

```mermaid
flowchart LR
    Login[ログイン] --> C_Dash[クライアントダッシュボード]
    C_Dash --> ApprovalList[承認待ち一覧]
    ApprovalList --> PostView[投稿確認]
    PostView --> Preview[プレビュー]
    PostView --> Approve{承認判断}
    Approve -->|"承認"| Approved[承認完了]
    Approve -->|"差し戻し"| Comment[修正コメント記入]
    Comment --> ApprovalList
    C_Dash --> Calendar[カレンダー閲覧]
```

**クライアントの主な操作**:
1. ログインまたはメール通知のリンクからアクセス
2. 承認待ち一覧で未確認の投稿を確認
3. プレビューでSNSでの見え方をチェック
4. 承認ボタンで承認 or 差し戻し（修正コメント付き）

### 3-5. ゲスト（ログイン不要）のフロー

```mermaid
flowchart LR
    Link[共有リンクアクセス] --> Validate{リンク有効性チェック}
    Validate -->|"有効"| SharedView[共有ビュー]
    Validate -->|"期限切れ"| Expired[期限切れ画面]
    SharedView --> Calendar[カレンダー閲覧]
    SharedView --> PostView[投稿プレビュー閲覧]
```

**ゲストの操作**:
1. 共有リンク（トークン付きURL）にアクセス
2. 有効期限・アクセス権の検証
3. 閲覧のみ可能（カレンダー、投稿プレビュー）

## 4. 投稿ステータス遷移図

```mermaid
stateDiagram-v2
    [*] --> Draft: 投稿作成
    Draft --> InProgress: 制作開始
    InProgress --> PendingReview: 承認申請
    PendingReview --> Revision: 差し戻し
    Revision --> PendingReview: 再申請
    PendingReview --> Approved: 承認
    Approved --> Scheduled: 投稿日時設定
    Scheduled --> Published: 投稿完了（手動確認）

    state Draft {
        [*]: 未着手
    }
    state InProgress {
        [*]: 制作中
    }
    state PendingReview {
        [*]: 承認待ち
    }
    state Revision {
        [*]: 修正中
    }
    state Approved {
        [*]: 承認済み
    }
    state Scheduled {
        [*]: 予約済み
    }
    state Published {
        [*]: 投稿完了
    }
```

### ステータス定義

| ステータス | 英名 | 説明 | 次のステータス |
|-----------|------|------|--------------|
| 未着手 | `draft` | 投稿が作成されたが制作未開始 | 制作中 |
| 制作中 | `in_progress` | スタッフが制作作業中 | 承認待ち |
| 承認待ち | `pending_review` | クライアントの承認を待っている状態 | 承認済み / 修正中 |
| 修正中 | `revision` | クライアントから差し戻され修正中 | 承認待ち |
| 承認済み | `approved` | クライアントが承認完了 | 予約済み |
| 予約済み | `scheduled` | 投稿日時が確定（手動設定） | 投稿完了 |
| 投稿完了 | `published` | SNSへの投稿が完了（手動確認） | - |

## 5. 承認フロー（多段階承認）

```mermaid
sequenceDiagram
    participant Staff as スタッフ
    participant Director as ディレクター
    participant ClientMgr as クライアント担当
    participant ClientDec as クライアント決裁者

    Staff->>Director: 承認申請
    Director->>Director: 内容確認
    alt 承認
        Director->>ClientMgr: 次ステップへ転送
        ClientMgr->>ClientMgr: 内容確認
        alt 承認
            ClientMgr->>ClientDec: 最終確認依頼
            ClientDec->>ClientDec: 最終確認
            alt 承認
                ClientDec-->>Staff: 承認完了通知
            else 差し戻し
                ClientDec-->>Staff: 修正依頼（コメント付き）
            end
        else 差し戻し
            ClientMgr-->>Staff: 修正依頼（コメント付き）
        end
    else 差し戻し
        Director-->>Staff: 修正依頼（コメント付き）
    end
```

**承認フローのカスタマイズ**:
- 企業ごとに承認ステップ数と各ステップの担当ロールを定義可能
- 最小構成: スタッフ → クライアント（2ステップ）
- 最大構成: 制限なし（企業の運用に合わせて自由に設定）

## 6. 主要画面のレイアウト概要

### 6-1. サイドバーナビゲーション（共通）

```
┌─────────────────────────────────────────┐
│ [エスカン ロゴ]                           │
├─────────────────────────────────────────┤
│ ◆ ダッシュボード                         │
│ ◆ カレンダー                             │
│ ◆ 企画一覧                               │
│ ◆ 承認待ち（バッジ: 件数）               │
│ ────────────                             │
│ ◆ チーム                                 │
│ ◆ 設定                                   │
│ ────────────                             │
│ [ワークスペース切替]                      │
│   ├ クライアントA                         │
│   ├ クライアントB                         │
│   └ クライアントC                         │
└─────────────────────────────────────────┘
```

### 6-2. カレンダー画面

```
┌─────────────────────────────────────────────────────┐
│ ← 2026年2月 →     [月表示] [週表示]    [+ 投稿作成] │
├──────┬──────┬──────┬──────┬──────┬──────┬──────────┤
│ 月    │ 火    │ 水    │ 木    │ 金    │ 土    │ 日    │
├──────┼──────┼──────┼──────┼──────┼──────┼──────────┤
│      │      │      │ [投稿]│      │      │          │
│      │      │      │ ■承認 │      │      │          │
│      │      │      │  待ち │      │      │          │
├──────┼──────┼──────┼──────┼──────┼──────┼──────────┤
│ [投稿]│      │      │      │ [投稿]│      │          │
│ ■制作│      │      │      │ ■予約│      │          │
│  中  │      │      │      │  済み │      │          │
└──────┴──────┴──────┴──────┴──────┴──────┴──────────┘
```

### 6-3. 投稿詳細・プレビュー画面

```
┌──────────────────────┬──────────────────────────────┐
│ [SNS風プレビュー]     │ 投稿情報                      │
│                       │ ─────────                     │
│ ┌──────────────────┐ │ ステータス: [承認待ち]         │
│ │ @username         │ │ 企画: 2月度運用                │
│ │ ┌──────────────┐ │ │ 種別: [Instagram フィード ▼]   │
│ │ │              │ │ │ 投稿予定: 2026/02/20 18:00    │
│ │ │   画像/動画   │ │ │ 担当: 田中太郎                │
│ │ │   プレビュー  │ │ │                               │
│ │ │              │ │ │ キャプション                   │
│ │ └──────────────┘ │ │ ┌────────────────────────┐  │
│ │ ♥ 💬 ✈           │ │ │ ここにキャプションが...    │  │
│ │ キャプション...    │ │ │                            │  │
│ │ #tag1 #tag2       │ │ └────────────────────────┘  │
│ └──────────────────┘ │ [🤖 AIで下書き生成]            │
│                       │                               │
│ [Instagram] [TikTok]  │ 素材 (Google Drive)            │
│                       │ ┌────────────────────────┐  │
│                       │ │ 📎 drive.google.com/...    │  │
│                       │ └────────────────────────┘  │
│                       │                               │
│                       │ [承認申請] [保存]              │
├──────────────────────┴──────────────────────────────┤
│ 修正指示・コメント                                    │
│ ──────────────────                                   │
│ [田中] 2/15 10:00                                     │
│   画像2枚目のテキストを修正してください                │
│   対象: 画像2枚目 | ステータス: 未対応                 │
│                                                       │
│ [クライアント佐藤] 2/15 14:00                          │
│   色味をもう少し明るくお願いします                     │
│   対象: 画像1枚目 | ステータス: 対応済み               │
│                                                       │
│ [コメント入力欄...                        ] [送信]     │
└───────────────────────────────────────────────────────┘
```

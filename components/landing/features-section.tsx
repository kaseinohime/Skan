import { CheckCircle2, Calendar, Sparkles, FileCheck, Users, Link2 } from "lucide-react";

const features = [
  {
    badge: "承認フロー",
    icon: FileCheck,
    color: "from-violet-500 to-indigo-600",
    bgLight: "bg-violet-50",
    iconColor: "text-violet-600",
    title: "「言った言わない」が消える",
    description:
      "ステップごとの承認・差し戻し・修正コメントをすべて記録。履歴が残るから、クライアントとのすれ違いがなくなります。",
    points: [
      "承認フローを企業単位でカスタマイズ",
      "差し戻しコメントが投稿に直接紐付く",
      "承認履歴がいつでも確認できる",
    ],
    mockup: "approval",
  },
  {
    badge: "カレンダー管理",
    icon: Calendar,
    color: "from-sky-500 to-blue-600",
    bgLight: "bg-sky-50",
    iconColor: "text-sky-600",
    title: "投稿計画が一目でわかる",
    description:
      "ドラッグ＆ドロップで投稿日を調整。月・週単位でチーム全体の進捗を把握できます。",
    points: [
      "月・週切替で全体像を把握",
      "ステータス別カラーでひと目でわかる",
      "クライアントと同じカレンダーを共有",
    ],
    mockup: "calendar",
  },
  {
    badge: "AIアシスト",
    icon: Sparkles,
    color: "from-amber-400 to-orange-500",
    bgLight: "bg-amber-50",
    iconColor: "text-amber-600",
    title: "ゼロから書かない",
    description:
      "テーマとトーンを入力するだけで、キャプション案を3パターン提案。下書きの時間を削って、クリエイティブに集中できます。",
    points: [
      "テーマ・ターゲット・トーンを指定",
      "キャプション3案＋ハッシュタグを提案",
      "生成した案をそのまま編集して使える",
    ],
    mockup: "ai",
  },
];

const subFeatures = [
  { icon: Users, label: "チーム・権限管理", desc: "スタッフ・クライアントの招待と役割設定" },
  { icon: Link2, label: "ゲスト共有リンク", desc: "ログイン不要で投稿を共有できる一時リンク" },
  { icon: CheckCircle2, label: "SNSプレビュー", desc: "Instagram・TikTok風のリアルなプレビュー" },
];

function ApprovalMockup() {
  return (
    <div className="space-y-3">
      {[
        { step: "STEP 1", label: "ディレクター確認", status: "承認済み", color: "text-emerald-600 bg-emerald-50" },
        { step: "STEP 2", label: "クライアント確認", status: "承認待ち", color: "text-amber-600 bg-amber-50" },
        { step: "STEP 3", label: "クライアント決裁", status: "未到達", color: "text-muted-foreground bg-muted/40" },
      ].map((s) => (
        <div key={s.step} className="flex items-center gap-3 rounded-xl bg-white/60 px-4 py-3 border border-border/30">
          <div className="text-[10px] font-bold text-muted-foreground/60 w-12 flex-shrink-0">{s.step}</div>
          <div className="flex-1 text-xs font-medium text-foreground/80">{s.label}</div>
          <div className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${s.color}`}>{s.status}</div>
        </div>
      ))}
      <div className="mt-4 rounded-xl bg-white/60 border border-border/30 p-3">
        <div className="text-[10px] text-muted-foreground mb-2">💬 修正コメント</div>
        <div className="text-xs text-foreground/70">「3枚目の画像、背景を白に変更してください」</div>
        <div className="mt-1 text-[10px] text-muted-foreground">田中（クライアント）· 2時間前</div>
      </div>
    </div>
  );
}

function CalendarMockup() {
  const days = ["月", "火", "水", "木", "金", "土", "日"];
  const posts = [
    { day: 1, title: "新商品紹介", status: "approved" },
    { day: 3, title: "お客様の声", status: "pending" },
    { day: 5, title: "スタッフ紹介", status: "draft" },
    { day: 6, title: "セール告知", status: "approved" },
  ];
  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {days.map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 14 }).map((_, i) => {
          const post = posts.find((p) => p.day === i + 1);
          return (
            <div key={i} className={`min-h-[52px] rounded-lg border ${post ? "border-primary/20 bg-primary/5" : "border-border/20 bg-white/30"} p-1.5`}>
              <div className="text-[10px] text-muted-foreground mb-1">{i + 1}</div>
              {post && (
                <div className={`rounded text-[9px] font-medium px-1 py-0.5 truncate ${
                  post.status === "approved" ? "bg-emerald-100 text-emerald-700" :
                  post.status === "pending" ? "bg-amber-100 text-amber-700" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {post.title}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AiMockup() {
  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-white/60 border border-border/30 p-3">
        <div className="text-[10px] text-muted-foreground mb-2">入力内容</div>
        <div className="text-xs text-foreground/70">テーマ: 新商品（スキンケア）の紹介<br />トーン: 親しみやすく · 20代女性向け</div>
      </div>
      <div className="flex items-center gap-2 text-[10px] text-amber-600 font-medium">
        <Sparkles className="h-3 w-3" />
        AIが3案を生成しました
      </div>
      {[
        "✨ 毎朝のケアを、もっと楽しく。新発売の〇〇で、透明感のある肌へ。気になる方はプロフのリンクから🌿",
        "みんなに聞かれる「その肌どうしてるの？」への答えが、ここに。新商品レポはストーリーズで公開中！",
      ].map((text, i) => (
        <div key={i} className="rounded-xl bg-white/60 border border-border/30 p-3">
          <div className="text-[10px] text-muted-foreground mb-1">案 {i + 1}</div>
          <p className="text-xs text-foreground/80 leading-relaxed">{text}</p>
        </div>
      ))}
    </div>
  );
}

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-primary/70">
          機能
        </div>
        <h2 className="mb-4 text-center text-3xl font-black tracking-tight text-foreground md:text-4xl">
          すべての確認・承認・管理を、一画面に。
        </h2>
        <p className="mb-20 text-center text-muted-foreground max-w-xl mx-auto">
          これまで複数のツールに散らばっていた作業が、ひとつのワークスペースで完結します。
        </p>

        <div className="space-y-20">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            const isEven = i % 2 === 0;
            return (
              <div
                key={feature.badge}
                className={`flex flex-col gap-10 lg:flex-row lg:items-center ${!isEven ? "lg:flex-row-reverse" : ""}`}
              >
                {/* テキスト */}
                <div className="flex-1">
                  <div className={`mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${feature.bgLight} ${feature.iconColor}`}>
                    <Icon className="h-3.5 w-3.5" />
                    {feature.badge}
                  </div>
                  <h3 className="mb-4 text-2xl font-black tracking-tight text-foreground md:text-3xl">
                    {feature.title}
                  </h3>
                  <p className="mb-6 text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                  <ul className="space-y-2.5">
                    {feature.points.map((point) => (
                      <li key={point} className="flex items-start gap-2.5 text-sm text-foreground/80">
                        <CheckCircle2 className={`mt-0.5 h-4 w-4 flex-shrink-0 ${feature.iconColor}`} />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* モックアップ */}
                <div className="flex-1">
                  <div className="rounded-2xl border border-white/60 bg-white/60 backdrop-blur-md p-6 shadow-[0_8px_40px_rgba(99,102,241,0.10)]">
                    <div className={`mb-4 flex items-center gap-2 text-xs font-semibold ${feature.iconColor}`}>
                      <div className={`flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br ${feature.color}`}>
                        <Icon className="h-3.5 w-3.5 text-white" />
                      </div>
                      {feature.badge}
                    </div>
                    {feature.mockup === "approval" && <ApprovalMockup />}
                    {feature.mockup === "calendar" && <CalendarMockup />}
                    {feature.mockup === "ai" && <AiMockup />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* サブ機能 */}
        <div className="mt-20 grid gap-4 sm:grid-cols-3">
          {subFeatures.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.label} className="rounded-2xl border border-white/60 bg-white/60 backdrop-blur-md p-5 shadow-[0_4px_24px_rgba(99,102,241,0.06)]">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <h4 className="mb-1 text-sm font-bold text-foreground">{f.label}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

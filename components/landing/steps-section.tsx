import { Building2, Users, CheckCircle2 } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Building2,
    title: "企業登録・クライアント追加",
    description: "会社情報を入力してアカウントを作成。クライアントのワークスペースを追加するだけで準備完了です。",
    time: "約5分",
  },
  {
    number: "02",
    icon: Users,
    title: "チームを招待",
    description: "メールアドレスを入力するだけでスタッフとクライアント担当者を招待。権限は役割ごとに自動で設定されます。",
    time: "約1分",
  },
  {
    number: "03",
    icon: CheckCircle2,
    title: "投稿を作成・承認を依頼",
    description: "カレンダーで計画を立て、投稿を作成。ワンクリックで承認フローを開始。クライアントへの確認依頼が自動で飛びます。",
    time: "今日から",
  },
];

export function StepsSection() {
  return (
    <section id="steps" className="py-24 px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-primary/70">
          使い方
        </div>
        <h2 className="mb-4 text-center text-3xl font-black tracking-tight text-foreground md:text-4xl">
          3ステップで、今日から使える。
        </h2>
        <p className="mb-16 text-center text-muted-foreground">
          複雑な設定は不要。登録から最初の承認依頼まで、最短15分。
        </p>

        <div className="relative">
          {/* 接続線（デスクトップ） */}
          <div className="absolute top-10 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] hidden h-px bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 lg:block" />

          <div className="grid gap-8 lg:grid-cols-3">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.number} className="relative flex flex-col items-center text-center">
                  {/* ステップ番号バッジ */}
                  <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-white/60 bg-white/70 backdrop-blur-md shadow-[0_8px_32px_rgba(99,102,241,0.12)]">
                    <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white shadow-sm">
                      {i + 1}
                    </div>
                    <Icon className="h-8 w-8 text-primary" />
                  </div>

                  <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/8 px-3 py-1 text-[10px] font-semibold text-primary mb-3">
                    ⏱ {step.time}
                  </div>
                  <h3 className="mb-3 text-lg font-bold text-foreground">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

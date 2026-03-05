import { MessageSquare, FileSpreadsheet, Clock, Search, HelpCircle, UserX } from "lucide-react";

const pains = [
  {
    icon: MessageSquare,
    text: 'LINEグループに「これ最新版ですか？」とまた来た',
  },
  {
    icon: Clock,
    text: "クライアントの返事を待ちながら、今日も作業が止まっている",
  },
  {
    icon: HelpCircle,
    text: "「修正してください」のメッセージ、どの投稿への指示かわからない",
  },
  {
    icon: FileSpreadsheet,
    text: "月末、どのExcelが最終版か探すだけで30分消えた",
  },
  {
    icon: Search,
    text: "先月伸びた理由を聞かれたが、記録が残っていない",
  },
  {
    icon: UserX,
    text: "新しいスタッフに投稿ルールをゼロから説明し続けている",
  },
];

export function PainSection() {
  return (
    <section className="py-24 px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-primary/70">
          あるある
        </div>
        <h2 className="mb-4 text-center text-3xl font-black tracking-tight text-foreground md:text-4xl">
          こんな状況、ありませんか？
        </h2>
        <p className="mb-14 text-center text-muted-foreground">
          SNS運用代行チームが毎日抱えている、非効率の正体。
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pains.map((pain, i) => {
            const Icon = pain.icon;
            return (
              <div
                key={i}
                className="group flex items-start gap-4 rounded-2xl border border-white/60 bg-white/60 backdrop-blur-md p-5 shadow-[0_4px_24px_rgba(99,102,241,0.06)] transition-all duration-200 hover:shadow-[0_8px_32px_rgba(99,102,241,0.12)] hover:-translate-y-0.5"
              >
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-rose-100">
                  <Icon className="h-4 w-4 text-rose-500" />
                </div>
                <p className="text-sm leading-relaxed text-foreground/80">{pain.text}</p>
              </div>
            );
          })}
        </div>

        {/* 区切りコピー */}
        <div className="mt-14 text-center">
          <p className="text-lg font-semibold text-foreground/80">
            これ全部、<span className="text-primary">ツールの問題</span>です。
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            あなたのチームが非効率なのではありません。<br />
            SNS運用代行のために設計されたツールを使っていないだけです。
          </p>
        </div>
      </div>
    </section>
  );
}

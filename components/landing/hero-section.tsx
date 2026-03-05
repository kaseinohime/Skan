import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* 背景グラデーションオーブ（強調版） */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[-10%] left-[-5%] h-[600px] w-[600px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] h-[500px] w-[500px] rounded-full bg-violet-400/10 blur-[100px]" />
        <div className="absolute top-[30%] right-[20%] h-[300px] w-[300px] rounded-full bg-indigo-400/8 blur-[80px]" />
      </div>

      <div className="relative mx-auto max-w-5xl px-6 py-24 text-center">
        {/* バッジ */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-4 py-1.5 text-xs font-semibold text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          SNS運用代行チーム向けSaaS
        </div>

        {/* ヘッドライン */}
        <h1 className="mb-6 text-5xl font-black leading-[1.1] tracking-tight text-foreground md:text-6xl lg:text-7xl">
          SNS運用代行の<br />
          <span className="text-primary">「確認待ち」</span>を、なくす。
        </h1>

        {/* サブコピー */}
        <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
          LINEとメールとExcelを行き来する承認フローを、ひとつのツールに。<br className="hidden md:block" />
          クライアントも、スタッフも、同じ画面で投稿を確認・承認できます。
        </p>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" asChild className="rounded-xl px-8 py-6 text-base font-semibold shadow-[0_4px_20px_rgba(99,102,241,0.3)] hover:shadow-[0_6px_28px_rgba(99,102,241,0.4)] transition-shadow">
            <Link href="/register">
              無料で始める（クレカ不要）
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button variant="ghost" size="lg" asChild className="rounded-xl px-6 py-6 text-base text-foreground/70 hover:text-foreground">
            <a href="#features">
              <Play className="mr-2 h-4 w-4" />
              機能を見る
            </a>
          </Button>
        </div>

        {/* 安心感 */}
        <p className="mt-5 text-xs text-muted-foreground/70">
          クレジットカード不要 · 初期費用¥0 · いつでも解約可能
        </p>

        {/* ダッシュボードモックイメージ */}
        <div className="mt-16 relative">
          <div className="absolute inset-0 -m-8 rounded-3xl bg-gradient-to-b from-primary/5 to-transparent blur-2xl" />
          <div className="relative rounded-2xl border border-white/60 bg-white/60 backdrop-blur-md shadow-[0_20px_80px_rgba(99,102,241,0.15)] overflow-hidden">
            {/* モックUI */}
            <div className="flex h-10 items-center gap-2 border-b border-border/30 bg-white/40 px-4">
              <div className="h-3 w-3 rounded-full bg-red-400/60" />
              <div className="h-3 w-3 rounded-full bg-amber-400/60" />
              <div className="h-3 w-3 rounded-full bg-emerald-400/60" />
              <div className="ml-4 h-4 w-48 rounded bg-muted/60" />
            </div>
            <div className="flex min-h-[320px] md:min-h-[420px]">
              {/* サイドバーモック */}
              <div className="hidden md:flex w-52 flex-col gap-2 border-r border-border/30 bg-white/30 p-4">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg font-black text-primary">S</span>
                  <span className="text-lg font-extralight text-foreground/30">kan</span>
                </div>
                {["ダッシュボード", "クライアント一覧", "承認待ち", "通知"].map((item, i) => (
                  <div key={i} className={`flex items-center gap-2 rounded-xl px-3 py-2 ${i === 0 ? "bg-primary text-white" : "text-foreground/50"}`}>
                    <div className={`h-3 w-3 rounded ${i === 0 ? "bg-white/40" : "bg-muted"}`} />
                    <span className="text-xs font-medium">{item}</span>
                    {i === 2 && <span className="ml-auto rounded-full bg-amber-500 px-1.5 py-0.5 text-[9px] text-white font-bold">3</span>}
                  </div>
                ))}
              </div>
              {/* メインエリアモック */}
              <div className="flex-1 p-6">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <div className="h-5 w-36 rounded bg-foreground/10 mb-2" />
                    <div className="h-3 w-24 rounded bg-muted" />
                  </div>
                  <div className="h-8 w-24 rounded-xl bg-primary/20" />
                </div>
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {[
                    { label: "クライアント", val: "12", color: "from-violet-500 to-indigo-600" },
                    { label: "承認待ち", val: "3", color: "from-amber-400 to-orange-500" },
                    { label: "今週の投稿", val: "28", color: "from-sky-400 to-blue-600" },
                  ].map((card) => (
                    <div key={card.label} className={`rounded-xl bg-gradient-to-br ${card.color} p-4`}>
                      <div className="text-2xl font-bold text-white">{card.val}</div>
                      <div className="text-[10px] text-white/70 mt-1">{card.label}</div>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  {[
                    { status: "承認待ち", color: "bg-amber-400", w: "w-3/4" },
                    { status: "承認済み", color: "bg-emerald-400", w: "w-2/3" },
                    { status: "差し戻し", color: "bg-rose-400", w: "w-1/2" },
                  ].map((row) => (
                    <div key={row.status} className="flex items-center gap-3 rounded-xl border border-border/30 bg-white/40 px-4 py-3">
                      <div className={`h-2 w-2 rounded-full ${row.color}`} />
                      <div className={`h-3 ${row.w} rounded bg-muted/60`} />
                      <div className="ml-auto h-5 w-14 rounded-lg bg-muted/40" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

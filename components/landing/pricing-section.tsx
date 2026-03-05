"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check, Sparkles } from "lucide-react";

const plans = [
  {
    name: "Free",
    tagline: "まず試してみたい方に",
    monthlyPrice: 0,
    yearlyPrice: 0,
    clientLimit: "1クライアント",
    staffLimit: "3名まで",
    highlight: false,
    ctaLabel: "無料で始める",
    ctaHref: "/register",
    features: [
      "投稿管理・承認フロー",
      "カレンダー管理",
      "SNSプレビュー",
      "AIキャプション生成（月5回）",
      "スタッフ3名まで",
    ],
    missing: ["ゲスト共有リンク", "承認フローカスタマイズ", "月次レポート", "優先サポート"],
  },
  {
    name: "Starter",
    tagline: "小規模チームに",
    monthlyPrice: 4980,
    yearlyPrice: 49800,
    clientLimit: "10クライアント",
    staffLimit: "10名まで",
    highlight: false,
    ctaLabel: "Starterで始める",
    ctaHref: "/register?plan=starter",
    features: [
      "投稿管理・承認フロー",
      "カレンダー管理",
      "SNSプレビュー",
      "AIキャプション生成（月50回）",
      "ゲスト共有リンク",
      "承認フローカスタマイズ",
      "スタッフ10名まで",
    ],
    missing: ["月次レポート", "優先サポート"],
  },
  {
    name: "Standard",
    tagline: "成長中の代理店に",
    monthlyPrice: 12800,
    yearlyPrice: 127000,
    clientLimit: "30クライアント",
    staffLimit: "無制限",
    highlight: true,
    ctaLabel: "Standardで始める",
    ctaHref: "/register?plan=standard",
    features: [
      "投稿管理・承認フロー",
      "カレンダー管理",
      "SNSプレビュー",
      "AIキャプション生成（月200回）",
      "ゲスト共有リンク",
      "承認フローカスタマイズ",
      "月次レポート",
      "スタッフ無制限",
    ],
    missing: ["優先サポート"],
  },
  {
    name: "Pro",
    tagline: "大規模運用に",
    monthlyPrice: 24800,
    yearlyPrice: 247000,
    clientLimit: "100クライアント",
    staffLimit: "無制限",
    highlight: false,
    ctaLabel: "Proで始める",
    ctaHref: "/register?plan=pro",
    features: [
      "投稿管理・承認フロー",
      "カレンダー管理",
      "SNSプレビュー",
      "AIキャプション生成（無制限）",
      "ゲスト共有リンク",
      "承認フローカスタマイズ",
      "月次レポート",
      "スタッフ無制限",
      "優先サポート",
    ],
    missing: [],
  },
];

export function PricingSection() {
  const [yearly, setYearly] = useState(false);

  return (
    <section id="pricing" className="py-24 px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-primary/70">
          料金
        </div>
        <h2 className="mb-4 text-center text-3xl font-black tracking-tight text-foreground md:text-4xl">
          シンプルな料金体系
        </h2>
        <p className="mb-8 text-center text-muted-foreground">
          招待されたワークスペースはカウント対象外。自社のクライアント数に合わせて選べます。
        </p>

        {/* 月払い/年払いトグル */}
        <div className="mb-12 flex items-center justify-center gap-3">
          <span className={`text-sm font-medium ${!yearly ? "text-foreground" : "text-muted-foreground"}`}>月払い</span>
          <button
            onClick={() => setYearly((v) => !v)}
            className={`relative h-7 w-12 rounded-full transition-colors duration-200 ${yearly ? "bg-primary" : "bg-muted"}`}
          >
            <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${yearly ? "translate-x-6" : "translate-x-1"}`} />
          </button>
          <span className={`text-sm font-medium ${yearly ? "text-foreground" : "text-muted-foreground"}`}>
            年払い
            <span className="ml-1.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              2ヶ月分お得
            </span>
          </span>
        </div>

        {/* プランカード */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border p-6 transition-all duration-200 ${
                plan.highlight
                  ? "border-primary/40 bg-gradient-to-b from-primary/8 to-primary/3 shadow-[0_8px_40px_rgba(99,102,241,0.15)] scale-[1.02]"
                  : "border-white/60 bg-white/60 backdrop-blur-md shadow-[0_4px_24px_rgba(99,102,241,0.06)]"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-[10px] font-bold text-white shadow-sm">
                  <Sparkles className="h-3 w-3" />
                  おすすめ
                </div>
              )}

              <div className="mb-4">
                <h3 className="text-lg font-black text-foreground">{plan.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{plan.tagline}</p>
              </div>

              <div className="mb-1">
                {plan.monthlyPrice === 0 ? (
                  <div className="text-4xl font-black text-foreground">¥0</div>
                ) : (
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-black text-foreground">
                      ¥{yearly
                        ? Math.round(plan.yearlyPrice / 12).toLocaleString()
                        : plan.monthlyPrice.toLocaleString()}
                    </span>
                    <span className="mb-1.5 text-sm text-muted-foreground">/月</span>
                  </div>
                )}
                {plan.monthlyPrice > 0 && yearly && (
                  <p className="text-[10px] text-muted-foreground">
                    年額 ¥{plan.yearlyPrice.toLocaleString()}（税別）
                  </p>
                )}
              </div>

              <div className="mb-5 space-y-1">
                <div className="text-xs font-semibold text-foreground/80">📦 {plan.clientLimit}</div>
                <div className="text-xs text-muted-foreground">👥 スタッフ {plan.staffLimit}</div>
              </div>

              <Button
                asChild
                className={`mb-6 w-full rounded-xl ${plan.highlight ? "" : "bg-foreground/8 text-foreground hover:bg-foreground/12"}`}
                variant={plan.highlight ? "default" : "outline"}
              >
                <Link href={plan.ctaHref}>{plan.ctaLabel}</Link>
              </Button>

              <ul className="space-y-2 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-foreground/80">
                    <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Enterprise */}
        <div className="mt-6 rounded-2xl border border-white/60 bg-white/60 backdrop-blur-md p-8 shadow-[0_4px_24px_rgba(99,102,241,0.06)]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-black text-foreground mb-1">Enterprise</h3>
              <p className="text-sm text-muted-foreground">
                100クライアント超の大規模運用・専用契約・カスタムサポートが必要な企業様へ
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                {["クライアント数無制限", "スタッフ無制限", "専任サポート", "カスタム請求"].map((tag) => (
                  <span key={tag} className="rounded-full bg-primary/8 px-3 py-1 text-xs font-medium text-primary">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <Button asChild size="lg" variant="outline" className="rounded-xl whitespace-nowrap border-border/60 shrink-0">
              <a href="mailto:hello@skan.jp">お問い合わせ</a>
            </Button>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground/70">
          ※ 料金はすべて税別表示。招待されたワークスペースはクライアント数にカウントされません。
        </p>
      </div>
    </section>
  );
}

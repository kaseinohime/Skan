"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "無料プランはずっと使えますか？",
    a: "はい。クライアント1社であれば期間制限なく無料でお使いいただけます。クレジットカードの登録も不要です。",
  },
  {
    q: "招待されたワークスペースは料金に影響しますか？",
    a: "影響しません。他の企業から担当スタッフとして招待されたワークスペースは、クライアント数のカウント対象外です。自社で作成・登録したクライアントのみが対象となります。",
  },
  {
    q: "途中でプランを変更できますか？",
    a: "いつでもアップグレード・ダウングレードが可能です。アップグレードは即時反映、ダウグレードは翌月の請求から適用されます。",
  },
  {
    q: "クライアント担当者への招待は有料ですか？",
    a: "いいえ。クライアント担当者（承認者）の招待は無料です。料金はあくまでクライアント数（ワークスペース数）に基づいています。",
  },
  {
    q: "セキュリティは大丈夫ですか？",
    a: "Supabaseの行レベルセキュリティ（RLS）により、自社のデータには自社のメンバーしかアクセスできません。通信はすべてHTTPS暗号化で保護されています。",
  },
  {
    q: "既存のスプレッドシートからデータを移行できますか？",
    a: "現在は手動での入力が必要ですが、クライアント情報と投稿データのインポート機能を開発予定です。初期設定のサポートもお気軽にご相談ください。",
  },
  {
    q: "解約はいつでもできますか？",
    a: "月払いプランは翌月から解約が反映されます。年払いプランは契約期間終了後に解約となります。途中解約による返金は対応しておりません。",
  },
  {
    q: "SNS APIとの自動連携はできますか？",
    a: "現在（Phase 1）はAPI連携による自動投稿・インサイト取得には対応していません。投稿はエスカン上で確認・承認し、実際の投稿は各SNSアプリから行う形です。Phase 2でAPI連携を予定しています。",
  },
];

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 px-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-primary/70">
          よくある質問
        </div>
        <h2 className="mb-14 text-center text-3xl font-black tracking-tight text-foreground md:text-4xl">
          FAQ
        </h2>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/60 bg-white/60 backdrop-blur-md shadow-[0_4px_24px_rgba(99,102,241,0.06)] overflow-hidden"
            >
              <button
                className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="text-sm font-semibold text-foreground">{faq.q}</span>
                <ChevronDown
                  className={`h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform duration-200 ${
                    open === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              {open === i && (
                <div className="border-t border-border/30 px-6 py-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

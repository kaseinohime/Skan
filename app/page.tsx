import { LandingNav } from "@/components/landing/landing-nav";
import { HeroSection } from "@/components/landing/hero-section";
import { PainSection } from "@/components/landing/pain-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { StepsSection } from "@/components/landing/steps-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { FaqSection } from "@/components/landing/faq-section";
import { ContactSection } from "@/components/landing/contact-section";
import { CtaSection } from "@/components/landing/cta-section";
import { FooterSection } from "@/components/landing/footer-section";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://skan.jp";

// 構造化データ（JSON-LD）
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    // サービス・プロダクト情報
    {
      "@type": "SoftwareApplication",
      name: "エスカン",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: siteUrl,
      description:
        "SNS運用代行チームの投稿管理・クライアント承認・AIキャプション生成を一元化するSaaS。LINEやExcelを使った承認フローから脱出できる。",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "JPY",
        description: "1クライアントまで永久無料",
      },
      featureList: [
        "投稿管理・カレンダー",
        "クライアント承認フロー",
        "AIキャプション生成",
        "チームメンバー招待",
        "レビューコメント機能",
        "ゲストリンク共有",
      ],
    },
    // 会社・ブランド情報
    {
      "@type": "Organization",
      name: "エスカン",
      url: siteUrl,
      description:
        "SNS運用代行チーム向けの投稿管理・承認ツール。スプレッドシートとLINEによる承認地獄を解決するSaaS。",
    },
    // WebSite（サイトリンク検索ボックス）
    {
      "@type": "WebSite",
      name: "エスカン",
      url: siteUrl,
    },
    // FAQの構造化データ（リッチスニペット対象）
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "無料プランはずっと使えますか？",
          acceptedAnswer: {
            "@type": "Answer",
            text: "はい。クライアント1社であれば期間制限なく無料でお使いいただけます。クレジットカードの登録も不要です。",
          },
        },
        {
          "@type": "Question",
          name: "招待されたワークスペースは料金に影響しますか？",
          acceptedAnswer: {
            "@type": "Answer",
            text: "影響しません。他の企業から担当スタッフとして招待されたワークスペースは、クライアント数のカウント対象外です。自社で作成・登録したクライアントのみが対象となります。",
          },
        },
        {
          "@type": "Question",
          name: "途中でプランを変更できますか？",
          acceptedAnswer: {
            "@type": "Answer",
            text: "いつでもアップグレード・ダウングレードが可能です。アップグレードは即時反映、ダウングレードは翌月の請求から適用されます。",
          },
        },
        {
          "@type": "Question",
          name: "クライアント担当者への招待は有料ですか？",
          acceptedAnswer: {
            "@type": "Answer",
            text: "いいえ。クライアント担当者（承認者）の招待は無料です。料金はあくまでクライアント数（ワークスペース数）に基づいています。",
          },
        },
        {
          "@type": "Question",
          name: "セキュリティは大丈夫ですか？",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Supabaseの行レベルセキュリティ（RLS）により、自社のデータには自社のメンバーしかアクセスできません。通信はすべてHTTPS暗号化で保護されています。",
          },
        },
        {
          "@type": "Question",
          name: "SNS APIとの自動連携はできますか？",
          acceptedAnswer: {
            "@type": "Answer",
            text: "現在はAPI連携による自動投稿・インサイト取得には対応していません。投稿はエスカン上で確認・承認し、実際の投稿は各SNSアプリから行う形です。",
          },
        },
      ],
    },
  ],
};

export default function HomePage() {
  return (
    <>
      {/* 構造化データ（JSON-LD） */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen">
        <LandingNav />
        <HeroSection />
        <PainSection />
        <FeaturesSection />
        <StepsSection />
        <PricingSection />
        <FaqSection />
        <ContactSection />
        <CtaSection />
        <FooterSection />
      </div>
    </>
  );
}

import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://skan.jp";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "SNS運用代行の投稿管理・承認ツール | エスカン",
    template: "%s | エスカン",
  },
  description:
    "SNS代行チームの「確認待ち」をなくすSaaS。LINEやExcelの承認フローをひとつに一元化。クライアントもスタッフも同じ画面で投稿確認・承認。1クライアントは無料。",
  keywords: [
    "SNS運用代行 ツール",
    "SNS 承認フロー",
    "クライアント承認 SNS",
    "投稿承認 システム",
    "SNS代行 管理ツール",
    "SNS運用 効率化",
    "SNS管理ツール",
    "投稿管理",
    "SNS代行",
    "Instagram管理",
    "TikTok管理",
    "SNS運用代行",
    "承認ワークフロー",
    "AIキャプション生成",
  ],
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  verification: {
    google: "_cLJIezYguu5TbECmIg-B_f6DuzsO_ysg4AIPFp2zuw",
  },
  openGraph: {
    title: "SNS運用代行の投稿管理・承認ツール | エスカン",
    description:
      "SNS代行チームの「確認待ち」をなくすSaaS。LINEやExcelの承認フローをひとつに一元化。クライアントもスタッフも同じ画面で投稿確認・承認。",
    type: "website",
    locale: "ja_JP",
    url: siteUrl,
    siteName: "エスカン",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "エスカン - SNS運用代行の投稿管理・承認ツール",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SNS運用代行の投稿管理・承認ツール | エスカン",
    description:
      "SNS代行チームの「確認待ち」をなくすSaaS。LINEやExcelの承認フローをひとつに一元化。",
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      {/* Google Analytics */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-T2N4ENG0EK"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-T2N4ENG0EK');
        `}
      </Script>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}

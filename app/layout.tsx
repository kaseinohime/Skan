import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "エスカン | SNS運用代行チームの投稿管理・承認ツール",
  description:
    "スプレッドシートとLINEの承認地獄から脱出。SNS代行チームの投稿管理・クライアント承認・AIキャプション生成を一元化。1クライアントは無料。",
  keywords: [
    "SNS運用",
    "投稿管理",
    "承認フロー",
    "SNS代行",
    "Instagram管理",
    "TikTok管理",
    "クライアント承認",
    "SNSツール",
  ],
  openGraph: {
    title: "エスカン | SNS運用代行チームの投稿管理・承認ツール",
    description:
      "スプレッドシートとLINEの承認地獄から脱出。SNS代行チームの投稿管理・クライアント承認・AIキャプション生成を一元化。",
    type: "website",
    locale: "ja_JP",
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

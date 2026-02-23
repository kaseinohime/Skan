import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "エスカン - SNS運用管理",
  description: "SNS運用代行の投稿管理・承認・アイデア出しを一元化",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}

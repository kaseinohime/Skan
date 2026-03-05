import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @react-pdf/renderer はサーバーサイド専用（canvas等のNode.jsモジュールを使用）
  serverExternalPackages: ["@react-pdf/renderer"],
};

export default nextConfig;

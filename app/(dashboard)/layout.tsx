import type { Metadata } from "next";
import { DashboardShell } from "@/components/layout/dashboard-shell";

// ダッシュボード系ページはログイン必須のためインデックス対象外
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell>
      {children}
    </DashboardShell>
  );
}

import { notFound } from "next/navigation";
import Link from "next/link";
import { getSharedLinkData } from "@/lib/guest-link";
import { SharedViewClient } from "./shared-view-client";

export const dynamic = "force-dynamic";

export default async function SharedPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!token?.trim()) notFound();

  let data;
  try {
    data = await getSharedLinkData(token);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "NOT_FOUND" || msg === "FORBIDDEN" || msg === "EXPIRED") {
      notFound();
    }
    throw e;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background px-4 py-3">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-lg font-semibold">{data.clientName}</h1>
          <span className="text-muted-foreground text-sm">共有リンクで閲覧中</span>
        </div>
      </header>
      <main className="container mx-auto p-6">
        <SharedViewClient data={data} />
      </main>
      <footer className="border-t py-4 text-center text-muted-foreground text-sm">
        このページは閲覧専用です。編集・承認はできません。
      </footer>
    </div>
  );
}

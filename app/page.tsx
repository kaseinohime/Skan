import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-3xl font-bold tracking-tight">エスカン</h1>
      <p className="text-center text-muted-foreground">
        SNS運用代行の投稿管理・承認・アイデア出しを一元化
      </p>
      <Button asChild>
        <Link href="/login">ログイン</Link>
      </Button>
    </main>
  );
}

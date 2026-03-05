import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FileCheck } from "lucide-react";
import { getPendingApprovalPosts } from "@/lib/approval";
import { ApprovalActions } from "./approval-actions";

export const dynamic = "force-dynamic";

export default async function ApprovalPendingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const posts = await getPendingApprovalPosts(supabase, user);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black text-foreground">
            <FileCheck className="h-6 w-6 text-amber-500" />
            承認待ち一覧
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {posts.length > 0
              ? `${posts.length}件の投稿が承認を待っています`
              : "承認が必要な投稿はありません"}
          </p>
        </div>
        <Button variant="outline" size="sm" className="rounded-xl" asChild>
          <Link href="/dashboard">← ダッシュボード</Link>
        </Button>
      </div>

      <ApprovalActions posts={posts} />
    </div>
  );
}

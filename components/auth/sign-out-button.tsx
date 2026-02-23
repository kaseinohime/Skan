"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function SignOutButton({
  variant = "outline",
  className,
}: {
  variant?: "default" | "outline" | "ghost" | "link" | "destructive" | "secondary";
  className?: string;
}) {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    router.push("/login");
  };

  return (
    <Button type="button" variant={variant} className={className} onClick={handleSignOut}>
      ログアウト
    </Button>
  );
}

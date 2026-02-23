"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function SignOutButton({
  variant = "ghost",
  className,
  showIcon = true,
}: {
  variant?: "default" | "outline" | "ghost" | "link" | "destructive" | "secondary";
  className?: string;
  showIcon?: boolean;
}) {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    router.push("/login");
  };

  return (
    <Button
      type="button"
      variant={variant}
      className={`w-full justify-start gap-2 ${className ?? ""}`}
      onClick={handleSignOut}
    >
      {showIcon && <LogOut className="h-4 w-4" />}
      ログアウト
    </Button>
  );
}

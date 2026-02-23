import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      // ロールを取得してマスターなら /master に飛ばす（get_my_profile RPC 使用）
      const { data: profileRows } = await supabase.rpc("get_my_profile");
      const profile = Array.isArray(profileRows) && profileRows.length > 0 ? profileRows[0] : null;
      const isMaster = profile?.system_role === "master";
      const targetPath = isMaster ? "/master" : next;
      const isLocalEnv = process.env.NODE_ENV === "development";
      const baseUrl = isLocalEnv ? request.url : origin;
      return NextResponse.redirect(new URL(targetPath, baseUrl));
    }
  }

  return NextResponse.redirect(new URL("/login?error=auth_callback", origin));
}

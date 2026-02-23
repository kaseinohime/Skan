import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export type SystemRole = "master" | "agency_admin" | "staff" | "client";

const PUBLIC_PATHS = ["/", "/login", "/register", "/forgot-password", "/reset-password"];
const AUTH_PATHS = ["/login", "/register", "/forgot-password", "/reset-password"];
const API_AUTH_PREFIX = "/api/auth";
const SHARED_PREFIX = "/shared/";

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.some((p) => pathname === p)) return true;
  if (pathname.startsWith(API_AUTH_PREFIX)) return true;
  if (pathname.startsWith(SHARED_PREFIX)) return true;
  return false;
}

function isAuthPath(pathname: string): boolean {
  return AUTH_PATHS.some((p) => pathname.startsWith(p));
}

/** ロールに応じたホームパス */
function homePathForRole(role: SystemRole | null): string {
  switch (role) {
    case "master":
      return "/master";
    case "agency_admin":
      return "/dashboard";
    case "staff":
    case "client":
      return "/dashboard";
    default:
      return "/dashboard";
  }
}

/** /master/* はマスターのみ */
function isMasterPath(pathname: string): boolean {
  return pathname.startsWith("/master");
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  let systemRole: SystemRole | null = null;
  if (authUser) {
    const { data: profile } = await supabase
      .from("users")
      .select("system_role")
      .eq("id", authUser.id)
      .single();
    if (profile?.system_role) {
      systemRole = profile.system_role as SystemRole;
    }
  }

  const pathname = request.nextUrl.pathname;

  // 認証済みでログイン/登録ページに来た → ロールに応じたホームへ
  if (authUser && systemRole && isAuthPath(pathname)) {
    const home = homePathForRole(systemRole);
    supabaseResponse = NextResponse.redirect(new URL(home, request.url));
    return supabaseResponse;
  }

  // 未認証で保護パスにアクセス → ログインへ
  if (!authUser && !isPublicPath(pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    supabaseResponse = NextResponse.redirect(loginUrl);
    return supabaseResponse;
  }

  // マスター専用パスにマスター以外でアクセス → ダッシュボードへ
  if (authUser && systemRole && systemRole !== "master" && isMasterPath(pathname)) {
    supabaseResponse = NextResponse.redirect(new URL("/dashboard", request.url));
    return supabaseResponse;
  }

  return supabaseResponse;
}

import { NextResponse } from "next/server";
import { processPendingInvitations } from "@/lib/invitations";

/**
 * ログインユーザー宛の未処理招待を処理する。
 * ダッシュボードレイアウトのブロックを避けるため、クライアントからマウント時に1回だけ呼ぶ。
 */
export async function POST() {
  await processPendingInvitations();
  return NextResponse.json({ ok: true });
}

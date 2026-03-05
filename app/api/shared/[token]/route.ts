import { getSharedLinkData } from "@/lib/guest-link";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  if (!token?.trim()) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "リンクが見つかりません。" } },
      { status: 404 }
    );
  }

  try {
    const payload = await getSharedLinkData(token);
    return NextResponse.json(payload);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "NOT_FOUND") {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "リンクが見つかりません。" } },
        { status: 404 }
      );
    }
    if (msg === "EXPIRED") {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "このリンクの有効期限が切れています。" } },
        { status: 403 }
      );
    }
    if (msg === "FORBIDDEN") {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "このリンクは無効です。" } },
        { status: 403 }
      );
    }
    throw e;
  }
}

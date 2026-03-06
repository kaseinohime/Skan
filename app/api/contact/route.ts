import { NextResponse } from "next/server";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON を解析できません。" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const company = typeof b.company === "string" ? b.company.trim() : "";
  const name = typeof b.name === "string" ? b.name.trim() : "";
  const email = typeof b.email === "string" ? b.email.trim() : "";
  const message = typeof b.message === "string" ? b.message.trim() : "";

  if (!name || !email || !message) {
    return NextResponse.json({ error: "必須項目を入力してください。" }, { status: 400 });
  }

  const gasUrl = process.env.CONTACT_GAS_URL;
  if (!gasUrl) {
    return NextResponse.json(
      { error: "お問い合わせフォームの設定が未完了です。" },
      { status: 503 }
    );
  }

  const res = await fetch(gasUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ company, name, email, message }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: "送信に失敗しました。しばらくしてからお試しください。" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}

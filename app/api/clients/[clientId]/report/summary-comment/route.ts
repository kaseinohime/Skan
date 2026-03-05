import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { NextResponse } from "next/server";
import OpenAI from "openai";

type Params = { params: Promise<{ clientId: string }> };

const SYSTEM_PROMPT = `あなたはSNS運用代行会社のコンサルタントです。
クライアントに提出する月次レポートの「総評コメント」を200〜300文字で作成してください。

## 注意事項
- 数値に基づいた客観的な評価をすること
- KPI目標との比較を含めること
- 次月への期待・改善点を1つ盛り込むこと
- 丁寧語（ですます調）で書くこと
- テキストのみ出力すること（マークダウン不要）`;

export async function POST(request: Request, { params }: Params) {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "ログインしてください。" } },
      { status: 401 }
    );
  }

  if (user.system_role === "client") {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "権限がありません。" } },
      { status: 403 }
    );
  }

  const { clientId } = await params;
  const supabase = await createClient();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "JSON を解析できません。" } },
      { status: 400 }
    );
  }

  const b = body as Record<string, unknown>;
  const year = typeof b.year === "number" ? b.year : new Date().getFullYear();
  const month = typeof b.month === "number" ? b.month : new Date().getMonth() + 1;

  // 月次データを取得してプロンプトに使う
  const from = new Date(year, month - 1, 1).toISOString();
  const to = new Date(year, month, 1).toISOString();

  const [{ data: client }, { data: settings }] = await Promise.all([
    supabase.from("clients").select("name").eq("id", clientId).single(),
    supabase
      .from("client_account_settings")
      .select("kpi_save_rate_target, kpi_home_rate_target")
      .eq("client_id", clientId)
      .maybeSingle(),
  ]);

  // 投稿インサイス集計
  const { data: insightsRows } = await supabase
    .from("post_insights")
    .select("reach, saves, save_rate, home_rate, profile_visit_rate")
    .eq("client_id", clientId)
    .gte("recorded_at", from)
    .lt("recorded_at", to);

  const kpiSave = settings?.kpi_save_rate_target ?? 0.02;
  const kpiHome = settings?.kpi_home_rate_target ?? 0.4;
  const pct = (v: number | null) => (v != null ? `${(v * 100).toFixed(1)}%` : "未計測");

  function avgArr(arr: (number | null)[]): number | null {
    const valid = arr.filter((v): v is number => v != null);
    if (valid.length === 0) return null;
    return valid.reduce((a, b) => a + b, 0) / valid.length;
  }

  const rows = insightsRows ?? [];
  const totalReach = rows.reduce((s, r) => s + (r.reach ?? 0), 0);
  const totalSaves = rows.reduce((s, r) => s + (r.saves ?? 0), 0);
  const avgSaveRate = avgArr(rows.map((r) => r.save_rate));
  const avgHomeRate = avgArr(rows.map((r) => r.home_rate));

  const userContent = `
クライアント名: ${client?.name ?? ""}
対象月: ${year}年${month}月

月間実績:
- 投稿数: ${rows.length}件（インサイス入力済み）
- 月間リーチ: ${totalReach.toLocaleString("ja")}
- 月間保存数: ${totalSaves.toLocaleString("ja")}
- 平均保存率: ${pct(avgSaveRate)}（目標 ${pct(kpiSave)}）
- 平均ホーム率: ${pct(avgHomeRate)}（目標 ${pct(kpiHome)}）
`.trim();

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: { code: "CONFIG_ERROR", message: "OPENAI_API_KEY が設定されていません。" } },
      { status: 503 }
    );
  }

  try {
    const openai = new OpenAI({ apiKey });
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
      temperature: 0.6,
    });

    const comment = response.choices[0]?.message?.content?.trim();
    if (!comment) throw new Error("AI から応答がありませんでした");

    // 利用履歴を記録
    await supabase.from("ai_usage").insert({
      user_id: user.id,
      usage_type: "insights_suggest",
    });

    return NextResponse.json({ comment });
  } catch (err) {
    const message = err instanceof Error ? err.message : "総評コメントの生成に失敗しました。";
    return NextResponse.json(
      { error: { code: "AI_ERROR", message } },
      { status: 502 }
    );
  }
}

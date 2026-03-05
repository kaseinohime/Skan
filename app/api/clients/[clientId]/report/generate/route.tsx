import React from "react";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { ReportDocument } from "@/components/report/report-document";
import { buildReportData } from "@/lib/report/build-report-data";
import { registerFonts } from "@/lib/report/fonts";
import type { Suggestion } from "@/lib/ai/insights-suggest";

type Params = { params: Promise<{ clientId: string }> };

export async function POST(request: Request, { params }: Params) {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "ログインしてください。" } },
      { status: 401 }
    );
  }

  const { clientId } = await params;

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
  const summaryComment = typeof b.summaryComment === "string" ? b.summaryComment : "";
  const nextPlan = typeof b.nextPlan === "string" ? b.nextPlan : "";
  const suggestions: Suggestion[] = Array.isArray(b.suggestions) ? (b.suggestions as Suggestion[]) : [];

  if (month < 1 || month > 12) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "month が不正です。" } },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const reportData = await buildReportData(supabase, clientId, year, month);

  if (!reportData) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "クライアントが見つかりません。" } },
      { status: 404 }
    );
  }

  // フォント登録（初回のみ実行）
  registerFonts();

  try {
    const buffer = await renderToBuffer(
      <ReportDocument
        data={reportData}
        summaryComment={summaryComment}
        nextPlan={nextPlan}
        suggestions={suggestions}
      />
    );

    const filename = `report_${reportData.client.name}_${year}_${String(month).padStart(2, "0")}.pdf`;

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "PDF生成に失敗しました。";
    return NextResponse.json(
      { error: { code: "PDF_ERROR", message } },
      { status: 500 }
    );
  }
}

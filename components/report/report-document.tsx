import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Svg,
  Line as SvgLine,
  Polyline,
} from "@react-pdf/renderer";
import type { ReportData } from "@/lib/report/build-report-data";
import type { Suggestion } from "@/lib/ai/insights-suggest";

// ─── スタイル ────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    fontFamily: "NotoSansJP",
    fontSize: 9,
    color: "#111827",
    paddingTop: 40,
    paddingBottom: 40,
    paddingLeft: 48,
    paddingRight: 48,
  },
  coverPage: {
    fontFamily: "NotoSansJP",
    backgroundColor: "#6366f1",
    justifyContent: "center",
    alignItems: "center",
  },
  coverTitle: { fontSize: 22, color: "#ffffff", fontFamily: "NotoSansJP", marginBottom: 8 },
  coverSub: { fontSize: 11, color: "#c7d2fe", fontFamily: "NotoSansJP", marginBottom: 4 },
  coverDate: { fontSize: 8, color: "#a5b4fc", fontFamily: "NotoSansJP", marginTop: 12 },
  sectionTitle: { fontSize: 12, fontFamily: "NotoSansJP", marginBottom: 10, color: "#6366f1", borderBottomWidth: 1, borderBottomColor: "#e5e7eb", paddingBottom: 4 },
  kpiRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  kpiCard: { flex: 1, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 4, padding: 10 },
  kpiLabel: { fontSize: 7, color: "#6b7280", fontFamily: "NotoSansJP", marginBottom: 4 },
  kpiValue: { fontSize: 16, fontFamily: "NotoSansJP", color: "#111827" },
  kpiSub: { fontSize: 7, color: "#6b7280", fontFamily: "NotoSansJP", marginTop: 2 },
  kpiGood: { color: "#10b981" },
  kpiPoor: { color: "#ef4444" },
  kpiWarn: { color: "#f59e0b" },
  tableHeader: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#d1d5db", paddingBottom: 4, marginBottom: 2 },
  tableRow: { flexDirection: "row", paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  thCell: { fontSize: 7, color: "#6b7280", fontFamily: "NotoSansJP" },
  tdCell: { fontSize: 8, fontFamily: "NotoSansJP", color: "#111827" },
  commentBox: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 4, padding: 12, marginTop: 8 },
  commentText: { fontSize: 9, lineHeight: 1.7, color: "#374151", fontFamily: "NotoSansJP" },
  suggCard: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 4, padding: 10, marginBottom: 8 },
  suggTitle: { fontSize: 9, fontFamily: "NotoSansJP", marginBottom: 4, color: "#111827" },
  suggBody: { fontSize: 8, color: "#6b7280", fontFamily: "NotoSansJP", lineHeight: 1.6 },
  pageNum: { position: "absolute", bottom: 20, right: 48, fontSize: 8, color: "#9ca3af", fontFamily: "NotoSansJP" },
  chartTitle: { fontSize: 9, color: "#374151", fontFamily: "NotoSansJP", marginBottom: 4 },
});

// ─── ユーティリティ ─────────────────────────────────────────────────────────
function pct(v: number | null, digits = 1) {
  if (v == null) return "—";
  return `${(v * 100).toFixed(digits)}%`;
}
function num(v: number | null) {
  if (v == null) return "—";
  return v.toLocaleString("ja");
}
function shortDate(d: string | null) {
  if (!d) return "—";
  const [, m, day] = d.split("-");
  return `${parseInt(m)}/${parseInt(day)}`;
}

// KPI達成ステータスのスタイルを返す
function kpiStyle(value: number | null, target: number) {
  if (value == null) return s.kpiSub;
  if (value >= target) return s.kpiGood;
  if (value >= target * 0.8) return s.kpiWarn;
  return s.kpiPoor;
}

// ─── SVG折れ線グラフ ────────────────────────────────────────────────────────
function buildPoints(values: number[], w: number, h: number, padL = 0, padT = 0): string {
  if (values.length < 2) return "";
  const max = Math.max(...values, 1);
  const n = values.length;
  const cW = w - padL;
  const cH = h - padT;
  return values
    .map((v, i) => {
      const x = padL + (i / (n - 1)) * cW;
      const y = padT + (1 - v / max) * cH;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function TrendLineSvg({
  values,
  color,
  width = 220,
  height = 80,
}: {
  values: number[];
  color: string;
  width?: number;
  height?: number;
}) {
  if (values.length < 2) {
    return (
      <View style={{ width, height, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ fontSize: 8, color: "#9ca3af", fontFamily: "NotoSansJP" }}>データなし</Text>
      </View>
    );
  }
  const padL = 4;
  const padT = 4;
  const points = buildPoints(values, width, height - 8, padL, padT);
  return (
    <Svg width={width} height={height}>
      {/* ベースライン */}
      <SvgLine
        x1={padL} y1={height - 4}
        x2={width} y2={height - 4}
        stroke="#e5e7eb" strokeWidth={0.5}
      />
      {/* データライン */}
      <Polyline points={points} stroke={color} strokeWidth={1.5} fill="none" />
    </Svg>
  );
}

// ─── 表紙ページ ──────────────────────────────────────────────────────────────
function CoverPage({ data }: { data: ReportData }) {
  const monthLabel = `${data.year}年${data.month}月`;
  return (
    <Page size="A4" style={[s.page, s.coverPage]}>
      <Text style={s.coverTitle}>月次レポート</Text>
      <Text style={s.coverSub}>{data.client.name}</Text>
      <Text style={s.coverSub}>{monthLabel}</Text>
      {data.client.instagram_username && (
        <Text style={s.coverDate}>@{data.client.instagram_username}</Text>
      )}
      <Text style={s.coverDate}>
        作成日: {new Date().toLocaleDateString("ja")}
      </Text>
    </Page>
  );
}

// ─── KPIサマリーページ ───────────────────────────────────────────────────────
function SummaryPage({
  data,
  summaryComment,
}: {
  data: ReportData;
  summaryComment: string;
}) {
  const { summary, kpiSaveRateTarget, kpiHomeRateTarget } = data;

  return (
    <Page size="A4" style={s.page}>
      <Text style={s.sectionTitle}>月次KPIサマリー — {data.year}年{data.month}月</Text>

      {/* KPIカード */}
      <View style={s.kpiRow}>
        <View style={s.kpiCard}>
          <Text style={s.kpiLabel}>月間リーチ</Text>
          <Text style={s.kpiValue}>{num(summary.total_reach)}</Text>
          <Text style={s.kpiSub}>保存数 {num(summary.total_saves)}</Text>
        </View>
        <View style={s.kpiCard}>
          <Text style={s.kpiLabel}>平均保存率</Text>
          <Text style={[s.kpiValue, kpiStyle(summary.avg_save_rate, kpiSaveRateTarget)]}>
            {pct(summary.avg_save_rate)}
          </Text>
          <Text style={s.kpiSub}>目標 {pct(kpiSaveRateTarget)}</Text>
        </View>
        <View style={s.kpiCard}>
          <Text style={s.kpiLabel}>平均ホーム率</Text>
          <Text style={[s.kpiValue, kpiStyle(summary.avg_home_rate, kpiHomeRateTarget)]}>
            {pct(summary.avg_home_rate)}
          </Text>
          <Text style={s.kpiSub}>目標 {pct(kpiHomeRateTarget, 0)}</Text>
        </View>
        <View style={s.kpiCard}>
          <Text style={s.kpiLabel}>投稿数</Text>
          <Text style={s.kpiValue}>{summary.post_count}</Text>
          <Text style={s.kpiSub}>
            インサイス入力済み {summary.posts_with_insights_count}件
          </Text>
        </View>
        <View style={s.kpiCard}>
          <Text style={s.kpiLabel}>平均プロフ遷移率</Text>
          <Text style={s.kpiValue}>{pct(summary.avg_profile_visit_rate)}</Text>
        </View>
      </View>

      {/* リーチ推移グラフ */}
      {data.trend.length >= 2 && (
        <View style={{ marginBottom: 16 }}>
          <Text style={s.chartTitle}>リーチ推移</Text>
          <TrendLineSvg
            values={data.trend.map((t) => t.reach)}
            color="#6366f1"
            width={480}
            height={80}
          />
          <View style={{ flexDirection: "row", gap: 12, marginTop: 4 }}>
            {data.trend.map((t, i) => (
              <Text key={i} style={{ fontSize: 6, color: "#9ca3af", fontFamily: "NotoSansJP" }}>
                {shortDate(t.date)}
              </Text>
            ))}
          </View>
        </View>
      )}

      {/* 総評コメント */}
      {summaryComment && (
        <View>
          <Text style={[s.sectionTitle, { fontSize: 10 }]}>総評</Text>
          <View style={s.commentBox}>
            <Text style={s.commentText}>{summaryComment}</Text>
          </View>
        </View>
      )}

      <Text style={s.pageNum} render={({ pageNumber }) => `${pageNumber}`} fixed />
    </Page>
  );
}

// ─── 投稿パフォーマンス一覧ページ ────────────────────────────────────────────
function PostsTablePage({ data }: { data: ReportData }) {
  const { posts, kpiSaveRateTarget, kpiHomeRateTarget } = data;

  // 25件ごとにページを分割
  const chunkSize = 25;
  const chunks: typeof posts[] = [];
  for (let i = 0; i < posts.length; i += chunkSize) {
    chunks.push(posts.slice(i, i + chunkSize));
  }
  if (chunks.length === 0) chunks.push([]);

  const COL = { title: 160, date: 50, type: 55, reach: 48, save: 48, home: 48, profile: 48 };

  return (
    <>
      {chunks.map((chunk, ci) => (
        <Page key={ci} size="A4" style={s.page}>
          <Text style={s.sectionTitle}>
            投稿別パフォーマンス{chunks.length > 1 ? ` (${ci + 1}/${chunks.length})` : ""}
          </Text>

          {/* ヘッダー */}
          <View style={s.tableHeader}>
            <Text style={[s.thCell, { width: COL.title }]}>タイトル</Text>
            <Text style={[s.thCell, { width: COL.date }]}>投稿日</Text>
            <Text style={[s.thCell, { width: COL.type }]}>種別</Text>
            <Text style={[s.thCell, { width: COL.reach, textAlign: "right" }]}>リーチ</Text>
            <Text style={[s.thCell, { width: COL.save, textAlign: "right" }]}>保存率</Text>
            <Text style={[s.thCell, { width: COL.home, textAlign: "right" }]}>ホーム率</Text>
            <Text style={[s.thCell, { width: COL.profile, textAlign: "right" }]}>プロフ遷移</Text>
          </View>

          {chunk.map((p) => {
            const saveStyle = kpiStyle(p.save_rate, kpiSaveRateTarget);
            const homeStyle = kpiStyle(p.home_rate, kpiHomeRateTarget);
            return (
              <View key={p.id} style={s.tableRow}>
                <View style={{ width: COL.title }}>
                  <Text style={[s.tdCell, { fontSize: 7 }]}>
                    {(p.has_insights ? p.title : `⚠ ${p.title}`).slice(0, 28)}
                  </Text>
                  {p.genre && (
                    <Text style={{ fontSize: 6, color: "#9ca3af", fontFamily: "NotoSansJP" }}>
                      {p.genre}
                    </Text>
                  )}
                </View>
                <Text style={[s.tdCell, { width: COL.date, fontSize: 7 }]}>
                  {shortDate(p.scheduled_at)}
                </Text>
                <Text style={[s.tdCell, { width: COL.type, fontSize: 7 }]}>
                  {p.platform}/{p.post_type}
                </Text>
                <Text style={[s.tdCell, { width: COL.reach, textAlign: "right" }]}>
                  {p.reach != null ? p.reach.toLocaleString("ja") : "—"}
                </Text>
                <Text style={[s.tdCell, saveStyle, { width: COL.save, textAlign: "right" }]}>
                  {pct(p.save_rate)}
                </Text>
                <Text style={[s.tdCell, homeStyle, { width: COL.home, textAlign: "right" }]}>
                  {pct(p.home_rate)}
                </Text>
                <Text style={[s.tdCell, { width: COL.profile, textAlign: "right" }]}>
                  {pct(p.profile_visit_rate)}
                </Text>
              </View>
            );
          })}

          <Text style={s.pageNum} render={({ pageNumber }) => `${pageNumber}`} fixed />
        </Page>
      ))}
    </>
  );
}

// ─── 改善提案・次月方針ページ ─────────────────────────────────────────────────
function SuggestionsPage({
  suggestions,
  nextPlan,
}: {
  suggestions: Suggestion[];
  nextPlan: string;
}) {
  if (!nextPlan && suggestions.length === 0) return null;

  const priorityLabel = { high: "高", medium: "中", low: "低" } as const;
  const priorityColor = { high: "#ef4444", medium: "#f59e0b", low: "#6b7280" } as const;
  const categoryLabel = {
    caption: "キャプション",
    visual: "ビジュアル",
    timing: "投稿時間",
    hashtag: "ハッシュタグ",
    strategy: "戦略",
  } as const;

  return (
    <Page size="A4" style={s.page}>
      {suggestions.length > 0 && (
        <>
          <Text style={s.sectionTitle}>AI改善提案</Text>
          {suggestions.map((sg, i) => (
            <View key={i} style={s.suggCard}>
              <View style={{ flexDirection: "row", gap: 6, alignItems: "center", marginBottom: 3 }}>
                <Text
                  style={{
                    fontSize: 7,
                    color: "#ffffff",
                    backgroundColor: priorityColor[sg.priority],
                    fontFamily: "NotoSansJP",
                    paddingHorizontal: 4,
                    paddingVertical: 1,
                    borderRadius: 2,
                  }}
                >
                  {priorityLabel[sg.priority]}
                </Text>
                <Text style={{ fontSize: 7, color: "#6b7280", fontFamily: "NotoSansJP" }}>
                  {categoryLabel[sg.category]}
                </Text>
                <Text style={s.suggTitle}>{sg.title}</Text>
              </View>
              <Text style={s.suggBody}>{sg.body}</Text>
            </View>
          ))}
        </>
      )}

      {nextPlan && (
        <>
          <Text style={[s.sectionTitle, { marginTop: suggestions.length > 0 ? 12 : 0 }]}>
            次月の運用方針
          </Text>
          <View style={s.commentBox}>
            <Text style={s.commentText}>{nextPlan}</Text>
          </View>
        </>
      )}

      <Text style={s.pageNum} render={({ pageNumber }) => `${pageNumber}`} fixed />
    </Page>
  );
}

// ─── メインドキュメント ──────────────────────────────────────────────────────
export type ReportDocumentProps = {
  data: ReportData;
  summaryComment: string;
  nextPlan: string;
  suggestions: Suggestion[];
};

export function ReportDocument({
  data,
  summaryComment,
  nextPlan,
  suggestions,
}: ReportDocumentProps) {
  return (
    <Document
      title={`月次レポート ${data.year}年${data.month}月 - ${data.client.name}`}
      author="エスカン"
    >
      <CoverPage data={data} />
      <SummaryPage data={data} summaryComment={summaryComment} />
      <PostsTablePage data={data} />
      {(nextPlan || suggestions.length > 0) && (
        <SuggestionsPage suggestions={suggestions} nextPlan={nextPlan} />
      )}
    </Document>
  );
}

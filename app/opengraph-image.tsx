import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import { join } from "path";

export const dynamic = "force-dynamic";
export const alt = "エスカン | SNS運用代行チームの投稿管理・承認ツール";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  // ローカルフォントを読み込む（日本語表示のため）
  const fontBold = await readFile(
    join(process.cwd(), "public/fonts/NotoSansJP-Bold.ttf")
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          background: "#ffffff",
          fontFamily: "'Noto Sans JP', sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* 右側の装飾ブロック（青背景） */}
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            width: "380px",
            height: "630px",
            background: "#2563EB",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* UIモックカード */}
          <div
            style={{
              width: "300px",
              background: "white",
              borderRadius: "12px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
            }}
          >
            {/* ステータスバッジ行 */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {[
                { label: "承認済み", bg: "#D1FAE5", color: "#065F46" },
                { label: "承認待ち", bg: "#FEF3C7", color: "#92400E" },
                { label: "制作中", bg: "#DBEAFE", color: "#1E40AF" },
              ].map((badge) => (
                <span
                  key={badge.label}
                  style={{
                    background: badge.bg,
                    color: badge.color,
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "3px 10px",
                    borderRadius: "20px",
                    display: "flex",
                  }}
                >
                  {badge.label}
                </span>
              ))}
            </div>

            {/* 投稿カード × 3 */}
            {[
              { title: "新商品紹介 Instagram投稿", dot: "#16A34A" },
              { title: "キャンペーン告知 リール", dot: "#D97706" },
              { title: "週次レポート用フィード", dot: "#2563EB" },
            ].map((item) => (
              <div
                key={item.title}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  background: "#F8FAFC",
                  borderRadius: "8px",
                  padding: "10px 12px",
                }}
              >
                <div
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    background: item.dot,
                    flexShrink: 0,
                    display: "flex",
                  }}
                />
                <span
                  style={{
                    fontSize: "12px",
                    color: "#0F172A",
                    fontWeight: 500,
                    display: "flex",
                  }}
                >
                  {item.title}
                </span>
              </div>
            ))}

            {/* ボタン */}
            <div
              style={{
                background: "#2563EB",
                color: "white",
                fontSize: "13px",
                fontWeight: 700,
                textAlign: "center",
                padding: "10px",
                borderRadius: "8px",
                display: "flex",
                justifyContent: "center",
              }}
            >
              承認する
            </div>
          </div>
        </div>

        {/* 左側コンテンツエリア */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "64px 72px",
            width: "820px",
          }}
        >
          {/* ロゴ */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "40px",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                background: "#2563EB",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  color: "white",
                  fontWeight: 800,
                  fontSize: "20px",
                  display: "flex",
                }}
              >
                S
              </span>
            </div>
            <span
              style={{
                fontSize: "22px",
                fontWeight: 700,
                color: "#0F172A",
                display: "flex",
              }}
            >
              エスカン
            </span>
          </div>

          {/* メインキャッチ */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginBottom: "28px",
            }}
          >
            <span
              style={{
                fontSize: "54px",
                fontWeight: 700,
                color: "#0F172A",
                lineHeight: 1.25,
                display: "flex",
              }}
            >
              SNS代行チームの
            </span>
            <div style={{ display: "flex", alignItems: "baseline" }}>
              <span
                style={{
                  fontSize: "54px",
                  fontWeight: 700,
                  color: "#0F172A",
                  lineHeight: 1.25,
                  display: "flex",
                }}
              >
                承認フローを
              </span>
              <span
                style={{
                  fontSize: "54px",
                  fontWeight: 700,
                  color: "#2563EB",
                  lineHeight: 1.25,
                  display: "flex",
                  marginLeft: "8px",
                }}
              >
                3ステップ
              </span>
              <span
                style={{
                  fontSize: "54px",
                  fontWeight: 700,
                  color: "#0F172A",
                  lineHeight: 1.25,
                  display: "flex",
                }}
              >
                に
              </span>
            </div>
            <span
              style={{
                fontSize: "54px",
                fontWeight: 700,
                color: "#0F172A",
                lineHeight: 1.25,
                display: "flex",
              }}
            >
              圧縮する。
            </span>
          </div>

          {/* 3つの機能ピル */}
          <div
            style={{
              display: "flex",
              gap: "10px",
              marginBottom: "36px",
            }}
          >
            {["投稿管理", "クライアント承認", "AI文章生成"].map((label) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "#EFF6FF",
                  border: "1px solid #BFDBFE",
                  borderRadius: "100px",
                  padding: "8px 20px",
                }}
              >
                <div
                  style={{
                    width: "7px",
                    height: "7px",
                    borderRadius: "50%",
                    background: "#2563EB",
                    display: "flex",
                  }}
                />
                <span
                  style={{
                    fontSize: "16px",
                    fontWeight: 500,
                    color: "#1D4ED8",
                    display: "flex",
                  }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* 区切り線 */}
          <div
            style={{
              width: "100%",
              height: "1px",
              background: "#E2E8F0",
              marginBottom: "28px",
              display: "flex",
            }}
          />

          {/* フッター */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "#0F172A",
                color: "white",
                padding: "12px 24px",
                borderRadius: "100px",
              }}
            >
              <span
                style={{ fontSize: "16px", fontWeight: 700, display: "flex" }}
              >
                1クライアント無料で試せる →
              </span>
            </div>
            <span
              style={{ fontSize: "15px", color: "#94A3B8", display: "flex" }}
            >
              クレジットカード不要
            </span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Noto Sans JP",
          data: fontBold,
          weight: 700,
          style: "normal",
        },
      ],
    }
  );
}

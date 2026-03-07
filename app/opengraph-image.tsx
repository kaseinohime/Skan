import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "エスカン | SNS運用代行チームの投稿管理・承認ツール";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  // Noto Sans JP をGoogle Fontsから取得（日本語表示のため）
  const [fontBold, fontRegular] = await Promise.all([
    fetchGoogleFont("Noto Sans JP", 700),
    fetchGoogleFont("Noto Sans JP", 400),
  ]);

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
        {/* 右側の装飾ブロック */}
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
            gap: "0px",
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
              <span
                style={{
                  background: "#D1FAE5",
                  color: "#065F46",
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "3px 10px",
                  borderRadius: "20px",
                  display: "flex",
                }}
              >
                承認済み
              </span>
              <span
                style={{
                  background: "#FEF3C7",
                  color: "#92400E",
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "3px 10px",
                  borderRadius: "20px",
                  display: "flex",
                }}
              >
                承認待ち
              </span>
              <span
                style={{
                  background: "#DBEAFE",
                  color: "#1E40AF",
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "3px 10px",
                  borderRadius: "20px",
                  display: "flex",
                }}
              >
                制作中
              </span>
            </div>

            {/* 投稿カード × 3 */}
            {[
              { title: "新商品紹介 Instagram投稿", status: "#D1FAE5", dot: "#16A34A" },
              { title: "キャンペーン告知 リール", status: "#FEF3C7", dot: "#D97706" },
              { title: "週次レポート用フィード", status: "#DBEAFE", dot: "#2563EB" },
            ].map((item, i) => (
              <div
                key={i}
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
                fontSize: "12px",
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
            gap: "0px",
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
              <span style={{ color: "white", fontWeight: 800, fontSize: "18px", display: "flex" }}>
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
              fontSize: "56px",
              fontWeight: 700,
              color: "#0F172A",
              lineHeight: 1.25,
              display: "flex",
              flexDirection: "column",
              gap: "0px",
              marginBottom: "24px",
            }}
          >
            <span style={{ display: "flex" }}>SNS代行チームの</span>
            <span style={{ display: "flex" }}>
              承認フローを
              <span
                style={{
                  color: "#2563EB",
                  display: "flex",
                  marginLeft: "8px",
                }}
              >
                3ステップ
              </span>
              に
            </span>
            <span style={{ display: "flex" }}>圧縮する。</span>
          </div>

          {/* 3つの機能ピル */}
          <div
            style={{
              display: "flex",
              gap: "10px",
              marginBottom: "40px",
              flexWrap: "wrap",
            }}
          >
            {["投稿管理", "クライアント承認", "AI文章生成"].map((label, i) => (
              <div
                key={i}
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
                <span
                  style={{
                    width: "7px",
                    height: "7px",
                    borderRadius: "50%",
                    background: "#2563EB",
                    display: "flex",
                    flexShrink: 0,
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

          {/* フッター：無料CTA */}
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
              <span style={{ fontSize: "16px", fontWeight: 700, display: "flex" }}>
                1クライアント無料で試せる
              </span>
              <span style={{ fontSize: "18px", display: "flex" }}>→</span>
            </div>
            <span
              style={{
                fontSize: "15px",
                color: "#94A3B8",
                display: "flex",
              }}
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
        ...(fontBold ? [{ name: "Noto Sans JP", data: fontBold, weight: 700 as const }] : []),
        ...(fontRegular ? [{ name: "Noto Sans JP", data: fontRegular, weight: 400 as const }] : []),
      ],
    }
  );
}

// Google FontsからフォントデータをArrayBufferで取得するヘルパー
async function fetchGoogleFont(family: string, weight: number): Promise<ArrayBuffer | null> {
  try {
    const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&display=swap`;
    const css = await fetch(cssUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    }).then((r) => r.text());

    // 最初のsrc: url(...)を取得
    const match = css.match(/src: url\(([^)]+)\)/);
    if (!match) return null;

    return fetch(match[1]).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

export type ColorPreset = {
  name: string;
  hsl: string;  // "252 68% 56%" 形式
  hex: string;  // スウォッチ表示用
};

export const COLOR_PRESETS: ColorPreset[] = [
  { name: "バイオレット",   hsl: "252 68% 56%",  hex: "#7c3aed" },
  { name: "インディゴ",    hsl: "239 68% 64%",  hex: "#6366f1" },
  { name: "ブルー",        hsl: "217 91% 60%",  hex: "#3b82f6" },
  { name: "スカイ",        hsl: "199 89% 48%",  hex: "#0ea5e9" },
  { name: "ティール",      hsl: "173 77% 39%",  hex: "#0d9488" },
  { name: "エメラルド",    hsl: "158 64% 46%",  hex: "#10b981" },
  { name: "ライム",        hsl: "84 64% 40%",   hex: "#65a30d" },
  { name: "アンバー",      hsl: "38 92% 50%",   hex: "#f59e0b" },
  { name: "オレンジ",      hsl: "25 95% 53%",   hex: "#f97316" },
  { name: "ローズ",        hsl: "347 77% 58%",  hex: "#f43f5e" },
  { name: "ピンク",        hsl: "330 81% 60%",  hex: "#ec4899" },
  { name: "スレート",      hsl: "215 25% 48%",  hex: "#64748b" },
];

export const DEFAULT_COLOR = COLOR_PRESETS[0];

const GLOBAL_KEY = "skan_theme_color";
const clientKey = (id: string) => `skan_client_color_${id}`;

export function getGlobalColor(): ColorPreset {
  if (typeof window === "undefined") return DEFAULT_COLOR;
  const saved = localStorage.getItem(GLOBAL_KEY);
  return COLOR_PRESETS.find((c) => c.hsl === saved) ?? DEFAULT_COLOR;
}

export function getClientColor(clientId: string): ColorPreset | null {
  if (typeof window === "undefined") return null;
  const saved = localStorage.getItem(clientKey(clientId));
  return COLOR_PRESETS.find((c) => c.hsl === saved) ?? null;
}

export function saveGlobalColor(color: ColorPreset): void {
  localStorage.setItem(GLOBAL_KEY, color.hsl);
}

export function saveClientColor(clientId: string, color: ColorPreset | null): void {
  if (color === null) {
    localStorage.removeItem(clientKey(clientId));
  } else {
    localStorage.setItem(clientKey(clientId), color.hsl);
  }
}

/**
 * テーマカラーを全体に適用する。
 *
 * - --color-h/s/l → globals.css の背景・グラデーションオーブ・muted・border が連動
 * - --primary / --ring → Tailwindクラス(bg-primary等)が直接参照するため明示的にセット
 * - --accent / --accent-foreground → プライマリから自動導出
 */
export function applyColor(hsl: string): void {
  const parts = hsl.split(" ");
  const h = parseFloat(parts[0]);
  const s = parseFloat(parts[1]);
  const l = parseFloat(parts[2]);

  const el = document.documentElement;

  // 背景・グラデーションオーブ・muted・border用（CSS変数で連動）
  el.style.setProperty("--color-h", String(h));
  el.style.setProperty("--color-s", `${s}%`);
  el.style.setProperty("--color-l", `${l}%`);

  // Tailwindクラスが hsl(var(--primary)) で直接参照するため明示的にセット
  el.style.setProperty("--primary", hsl);
  el.style.setProperty("--ring", hsl);

  // アクセントカラーをプライマリから自動導出
  el.style.setProperty(
    "--accent",
    `${h} ${Math.max(s - 28, 15)}% ${Math.min(l + 38, 96)}%`
  );
  el.style.setProperty(
    "--accent-foreground",
    `${h} ${s}% ${Math.max(l - 18, 20)}%`
  );
}

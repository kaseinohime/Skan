import { Font } from "@react-pdf/renderer";
import path from "path";

let registered = false;

export function registerFonts() {
  if (registered) return;
  Font.register({
    family: "NotoSansJP",
    src: path.join(process.cwd(), "public/fonts/NotoSansJP-Regular.otf"),
  });
  // 日本語は自動ハイフネーション不要
  Font.registerHyphenationCallback((word) => [word]);
  registered = true;
}

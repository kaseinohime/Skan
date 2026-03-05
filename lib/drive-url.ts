/**
 * Google Drive URL からファイルIDを抽出する
 * 対応形式:
 * - https://drive.google.com/file/d/FILE_ID/view
 * - https://drive.google.com/open?id=FILE_ID
 * - https://drive.google.com/uc?id=FILE_ID
 */
export function getGoogleDriveFileId(url: string): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  const patterns = [
    /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
  ];

  for (const re of patterns) {
    const m = trimmed.match(re);
    if (m?.[1]) return m[1];
  }
  return null;
}

/**
 * 画像表示用の Google Drive URL（img src 用）
 * 注: 共有設定によっては表示されない場合がある
 */
export function getGoogleDriveImageUrl(url: string): string | null {
  const id = getGoogleDriveFileId(url);
  if (!id) return null;
  return `https://drive.google.com/uc?export=view&id=${id}`;
}

/**
 * 動画プレビュー用の Google Drive embed URL（iframe 用）
 */
export function getGoogleDriveEmbedUrl(url: string): string | null {
  const id = getGoogleDriveFileId(url);
  if (!id) return null;
  return `https://drive.google.com/file/d/${id}/preview`;
}

/**
 * 渡された URL が Google Drive のリンクかどうか
 */
export function isGoogleDriveUrl(url: string): boolean {
  return getGoogleDriveFileId(url) !== null;
}

/**
 * CSS ユーティリティ関数
 * レスポンシブなサイズ計算のためのヘルパー関数を提供
 */

/** デフォルトのルートフォントサイズ（px） */
const DEFAULT_ROOT_FONT_SIZE_PX = 16;

/**
 * px 値を rem 単位に変換する
 *
 * @param px - 変換するピクセル値
 * @param rootFontSizePx - ルートフォントサイズ（デフォルト: 16px）
 * @returns rem 形式の文字列（例: "1.5rem"）
 */
export function rem(px: number, rootFontSizePx = DEFAULT_ROOT_FONT_SIZE_PX): string {
  return `${px / rootFontSizePx}rem`;
}

/**
 * px 値を em 単位に変換する
 *
 * @param px - 変換するピクセル値
 * @param basePx - 基準フォントサイズ（デフォルト: 16px）
 * @returns em 形式の文字列（例: "1.5em"）
 */
export function em(px: number, basePx = DEFAULT_ROOT_FONT_SIZE_PX): string {
  return `${px / basePx}em`;
}

/**
 * ビューポート幅に応じて滑らかにサイズが変化する clamp() 値を生成する
 *
 * 最小幅（minVwPx）では minPx、最大幅（maxVwPx）では maxPx になり、
 * その間は線形補間で滑らかに変化する。
 *
 * @param minPx - 最小サイズ（px）
 * @param maxPx - 最大サイズ（px）
 * @param minVwPx - 最小ビューポート幅（デフォルト: 390px = iPhone 12/13）
 * @param maxVwPx - 最大ビューポート幅（デフォルト: 1206px）
 * @param rootFontSizePx - ルートフォントサイズ（デフォルト: 16px）
 * @returns CSS clamp() 関数の文字列
 *
 * @example
 * // 幅340px〜500pxで可変するスタイル
 * style={{ width: sizeClamp(340, 500) }}
 */
export function sizeClamp(
  minPx: number,
  maxPx: number,
  minVwPx = 390,
  maxVwPx = 1206,
  rootFontSizePx = DEFAULT_ROOT_FONT_SIZE_PX
): string {
  const min = minPx / rootFontSizePx;
  const max = maxPx / rootFontSizePx;

  return `clamp(${min}rem, calc(${min}rem + (${maxPx} - ${minPx}) * ((100vw - ${minVwPx}px) / (${maxVwPx} - ${minVwPx}))), ${max}rem)`;
}

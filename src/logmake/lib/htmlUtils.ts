/**
 * HTML テキストノードに埋め込む文字列をエスケープする。
 * 呼び出しごとにエスケープを適用する（冪等でない）。
 * すでにエスケープ済みの文字列への適用は呼び出し側が避けること。
 *
 * @param text - エスケープ対象の文字列
 * @returns HTML エスケープ済み文字列
 */
export function escapeText(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export const SAFE_HEX_COLOR = /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/
export const SAFE_RGBA_COLOR = /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+\s*)?\)$/

/**
 * CSS プロパティ値として使用する色文字列を検証し、不正な値は安全なフォールバックに置換する。
 * 許可形式: #RGB, #RRGGBB, rgb(...), rgba(...), transparent
 *
 * @param value - 検証する色文字列
 * @returns 安全な CSS 色文字列
 */
export function sanitizeCssColor(value: string): string {
  const trimmed = value.trim()
  if (
    trimmed === 'transparent' ||
    SAFE_HEX_COLOR.test(trimmed) ||
    SAFE_RGBA_COLOR.test(trimmed)
  ) {
    return trimmed
  }
  return '#ffffff'
}

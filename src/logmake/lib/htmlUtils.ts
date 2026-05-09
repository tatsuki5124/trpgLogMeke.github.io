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

const ALLOWED_CONTENT_TAGS = new Set([
  'b',
  'strong',
  'i',
  'em',
  'u',
  's',
  'span',
  'ruby',
  'rt',
  'rp',
  'br',
])

const DROP_CONTENT_TAGS = new Set([
  'script',
  'style',
  'iframe',
  'object',
  'embed',
  'svg',
  'math',
])

/**
 * CCFOLIA の発言本文 HTML を許可リスト方式で安全化する。
 * 軽いインライン書式は残すが、属性と危険タグは出力しない。
 *
 * @param html - CCFOLIA 由来の本文 HTML フラグメント
 * @returns 安全化済み HTML フラグメント
 */
export function sanitizeContentHtml(html: string): string {
  const document = new DOMParser().parseFromString(
    `<template>${html}</template>`,
    'text/html',
  )
  const template = document.querySelector('template')
  if (!template) {
    return escapeText(html)
  }

  return Array.from(template.content.childNodes).map(sanitizeNode).join('')
}

function sanitizeNode(node: Node): string {
  if (node.nodeType === 3) {
    return escapeText(node.textContent ?? '')
  }

  if (node.nodeType !== 1) {
    return ''
  }

  const element = node as Element
  const tagName = element.tagName.toLowerCase()
  if (DROP_CONTENT_TAGS.has(tagName)) {
    return ''
  }

  const children = Array.from(element.childNodes).map(sanitizeNode).join('')
  if (!ALLOWED_CONTENT_TAGS.has(tagName)) {
    return children
  }

  if (tagName === 'br') {
    return '<br>'
  }

  return `<${tagName}>${children}</${tagName}>`
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

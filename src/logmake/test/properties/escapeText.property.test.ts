import fc from 'fast-check'
import { describe, expect, test } from 'vitest'

import { escapeText, sanitizeContentHtml } from '@/logmake/lib/htmlUtils'

describe('escapeText', () => {
  test('出力に < が含まれない', () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        expect(escapeText(s)).not.toContain('<')
      })
    )
  })

  test('出力に > が含まれない', () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        expect(escapeText(s)).not.toContain('>')
      })
    )
  })

  test('既知の特殊文字が正しいエスケープシーケンスに変換される', () => {
    expect(escapeText('<')).toBe('&lt;')
    expect(escapeText('>')).toBe('&gt;')
    expect(escapeText('&')).toBe('&amp;')
    expect(escapeText('"')).toBe('&quot;')
    expect(escapeText("'")).toBe('&#39;')
  })

  test('複合文字列が正しくエスケープされる', () => {
    expect(escapeText('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    )
  })
})

describe('sanitizeContentHtml', () => {
  test('CCFOLIA の軽いインライン書式を残し、危険なタグと属性を除去する', () => {
    const output = sanitizeContentHtml(
      '<b>太字</b><span style="color:red" onclick="alert(1)">本文</span><img src=x onerror="alert(1)"><script>alert("xss")</script><ruby>山<rt>やま</rt></ruby>'
    )

    expect(output).toContain('<b>太字</b>')
    expect(output).toContain('<span>本文</span>')
    expect(output).toContain('<ruby>山<rt>やま</rt></ruby>')
    expect(output).not.toContain('<script')
    expect(output).not.toContain('<img')
    expect(output).not.toContain('onclick')
    expect(output).not.toContain('style=')
    expect(output).not.toContain('onerror')
  })

  test('未知タグはタグだけ外し、テキストノードの特殊文字は安全に保つ', () => {
    const output = sanitizeContentHtml(
      '<unknown>1 < 2 & 3 > 2</unknown><a href="javascript:alert(1)">link</a>'
    )

    expect(output).toContain('1 &lt; 2 &amp; 3 &gt; 2')
    expect(output).toContain('link')
    expect(output).not.toContain('<unknown')
    expect(output).not.toContain('<a')
    expect(output).not.toContain('javascript:')
  })
})

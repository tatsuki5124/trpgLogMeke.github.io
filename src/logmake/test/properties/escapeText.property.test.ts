import fc from 'fast-check'
import { describe, expect, test } from 'vitest'

import { escapeText } from '@/logmake/lib/htmlUtils'

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

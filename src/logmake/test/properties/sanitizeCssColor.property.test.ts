import fc from 'fast-check'
import { describe, expect, test } from 'vitest'

import { sanitizeCssColor } from '@/logmake/lib/htmlUtils'

const hexChar = fc.constantFrom(
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
  'a', 'b', 'c', 'd', 'e', 'f', 'A', 'B', 'C', 'D', 'E', 'F'
)
const hexN = (n: number) => fc.array(hexChar, { minLength: n, maxLength: n }).map((a) => a.join(''))

const validHex = fc.oneof(
  hexN(3).map((h) => `#${h}`),
  hexN(6).map((h) => `#${h}`)
)

const validRgb = fc.tuple(
  fc.integer({ min: 0, max: 255 }),
  fc.integer({ min: 0, max: 255 }),
  fc.integer({ min: 0, max: 255 })
).map(([r, g, b]) => `rgb(${r}, ${g}, ${b})`)

const validRgba = fc.tuple(
  fc.integer({ min: 0, max: 255 }),
  fc.integer({ min: 0, max: 255 }),
  fc.integer({ min: 0, max: 255 }),
  fc.integer({ min: 0, max: 10 }).map((n) => n / 10)
).map(([r, g, b, a]) => `rgba(${r}, ${g}, ${b}, ${a})`)

describe('sanitizeCssColor', () => {
  test('有効な hex カラーはそのまま返す', () => {
    fc.assert(
      fc.property(validHex, (color) => {
        expect(sanitizeCssColor(color)).toBe(color)
      })
    )
  })

  test('有効な rgb() はそのまま返す', () => {
    fc.assert(
      fc.property(validRgb, (color) => {
        expect(sanitizeCssColor(color)).toBe(color)
      })
    )
  })

  test('有効な rgba() はそのまま返す', () => {
    fc.assert(
      fc.property(validRgba, (color) => {
        expect(sanitizeCssColor(color)).toBe(color)
      })
    )
  })

  test('transparent はそのまま返す', () => {
    expect(sanitizeCssColor('transparent')).toBe('transparent')
  })

  test('前後の空白はトリム後に評価される', () => {
    expect(sanitizeCssColor('  #fff  ')).toBe('#fff')
    expect(sanitizeCssColor('  transparent  ')).toBe('transparent')
  })

  test('不正な値は #ffffff を返す（インジェクション文字が混入しない）', () => {
    const injectionAttempts = [
      'red',
      'blue',
      'expression(alert(1))',
      '}body{display:none}',
      '#gggggg',
      '',
      'url(evil)',
      'inherit',
    ]
    for (const val of injectionAttempts) {
      expect(sanitizeCssColor(val)).toBe('#ffffff')
    }
  })

  test('任意の文字列を渡しても出力は安全な色文字列', () => {
    const safePattern = /^(#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?|rgba?\(.*\)|transparent|#ffffff)$/
    fc.assert(
      fc.property(fc.string(), (s) => {
        expect(sanitizeCssColor(s)).toMatch(safePattern)
      })
    )
  })
})

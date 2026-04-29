import fc from 'fast-check'
import { describe, expect, test } from 'vitest'

import { buildOutputHtml } from '@/logmake/lib/buildOutputHtml'
import type { LogmakeSettings, OutputModel } from '@/logmake/types'

const emptyOutputModel: OutputModel = {
  toggles: [],
  sections: [],
}

const settingsArb = fc.record<LogmakeSettings>({
  logFileName: fc.string(),
  title: fc.string(),
  nameColor: fc.string(),
  frameColor: fc.string(),
  backColor: fc.string(),
})

describe('buildOutputHtml', () => {
  test('任意の設定を渡しても出力が <!DOCTYPE html> で始まる', () => {
    fc.assert(
      fc.property(settingsArb, (settings) => {
        const html = buildOutputHtml(emptyOutputModel, settings)
        expect(html.trimStart()).toMatch(/^<!DOCTYPE html>/i)
      })
    )
  })

  test('任意の色文字列を渡しても </style> が閉じられている（CSS ブレークアウトしない）', () => {
    fc.assert(
      fc.property(settingsArb, (settings) => {
        const html = buildOutputHtml(emptyOutputModel, settings)
        expect(html).toContain('</style>')
        const styleOpen = html.indexOf('<style>')
        const styleClose = html.indexOf('</style>')
        expect(styleOpen).toBeLessThan(styleClose)
      })
    )
  })
})

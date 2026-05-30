import { readFileSync } from 'fs'
import path from 'path'

import { describe, expect, it } from 'vitest'

import { createDefaultSettings } from '@/logmake/lib/defaults'
import { parseLogHtml } from '@/logmake/lib/parseLogHtml'
import { getLogmakeSystem } from '@/logmake/systems'
import {
  buildCandidateColoredBodyComparisonHtml,
  buildCandidateCombinedComparisonHtml,
  buildSpeakerAfterLineComparisonHtml,
  buildSpeakerBodyGuideComparisonHtml,
  buildVisualComparisonOutputModel,
} from '@/logmake/test/outputVisualComparison'

const FIXTURE_DIR = path.resolve(__dirname, 'fixtures')
const COC6_SYSTEM = getLogmakeSystem('CoC6')

describe('output visual comparison helpers', () => {
  it('uses a fixture with multiple speakers, primary tabs, an auxiliary tab, and dice highlights', () => {
    const html = readComparisonFixture()
    const parsed = parseLogHtml(html, COC6_SYSTEM)

    expect(Object.keys(parsed.tabs)).toEqual(['メイン', '情報', '雑談'])
    expect(Object.keys(parsed.characters)).toEqual([
      '探索者A',
      '探索者B',
      'KP',
      'GM',
      '話者なし',
      '場面：地下室前',
      '淡色の探索者',
      '鮮烈な探索者',
      '古い日記',
      '雑談メモ',
      '手がかりメモ',
    ])
    expect(parsed.entries.some((entry) => entry.charName === 'GM')).toBe(true)
    expect(parsed.entries.some((entry) => entry.charName === '話者なし')).toBe(
      true,
    )
    expect(
      parsed.entries.some((entry) => entry.charName === '場面：地下室前'),
    ).toBe(true)
    expect(parsed.entries.some((entry) => entry.tabName === '雑談')).toBe(true)
    expect(
      parsed.entries.some(
        (entry) => entry.tabName === '雑談' && entry.charName === '探索者B',
      ),
    ).toBe(true)
    expect(
      parsed.entries.some((entry) =>
        entry.paragraphs.some((paragraph) =>
          paragraph.tokens.some((token) => token.highlight === 'failure'),
        ),
      ),
    ).toBe(true)
    expect(
      parsed.entries.some((entry) =>
        entry.paragraphs.some((paragraph) =>
          paragraph.tokens.some((token) => token.highlight === 'success'),
        ),
      ),
    ).toBe(true)
  })

  it('applies comparison-only style overrides for the fixture model', () => {
    const outputModel = buildComparisonModel()
    const entries = outputModel.sections.flatMap((section) => section.entries)

    expect(entries.find((entry) => entry.charName === '淡色の探索者')?.style).toBe(
      'character',
    )
    expect(
      entries.find((entry) => entry.charName === '鮮烈な探索者')?.style,
    ).toBe('character')
    expect(
      entries.find((entry) => entry.charName === '場面：地下室前')?.style,
    ).toBe('scene')
  })

  it('renders the trimmed comparison variants from the same model', () => {
    const outputModel = buildComparisonModel()
    const settings = createDefaultSettings('comparison')
    const coloredBody = buildCandidateColoredBodyComparisonHtml(outputModel, {
      ...settings,
      title: '発言色付き統合案',
    })
    const afterLine = buildSpeakerAfterLineComparisonHtml(outputModel, {
      ...settings,
      title: '名前後ろライン',
    })
    const bodyGuide = buildSpeakerBodyGuideComparisonHtml(outputModel, {
      ...settings,
      title: '本文ガイド',
    })
    const candidate = buildCandidateCombinedComparisonHtml(outputModel, {
      ...settings,
      title: '統合候補',
    })

    for (const structuredHtml of [
      coloredBody,
      afterLine,
      bodyGuide,
      candidate,
    ]) {
      expect(structuredHtml).toContain('shared structured layout')
      expect(structuredHtml).toContain('margin: 1.7rem 1rem 1.7rem .5rem;')
      expect(structuredHtml).toContain('padding-block: .25rem;')
      expect(structuredHtml).toContain('margin: 2rem 0 .65rem .5rem;')
      expect(structuredHtml).toContain(
        '.log-entry--scene .log-message {\n    color: #555555;',
      )
      expect(structuredHtml).toContain('margin: .65rem 1rem .65rem .5rem;')
      expect(structuredHtml).toContain('padding-inline: 0 .5rem;')
      expect(structuredHtml).toContain('border-inline-start: 0;')
      expect(structuredHtml).toContain('margin: 1.75rem 1.25rem 1.5rem;')
      expect(structuredHtml).toContain('border: solid 3px #707070;')
      expect(structuredHtml).toContain('margin: 1.1rem .75rem .95rem;')
      expect(structuredHtml).not.toContain('compact tab content spacing')
      expect(structuredHtml).not.toContain('padding-block: 1rem .75rem;')
      expect(structuredHtml).toContain('overflow-wrap: break-word;')
      expect(structuredHtml).toContain('word-break: auto-phrase;')
    }

    for (const baseBodyHtml of [afterLine, bodyGuide, candidate]) {
      expect(baseBodyHtml).toContain('color: #333333;')
      expect(baseBodyHtml).not.toContain('speaker body character color')
    }

    expect(coloredBody).toContain('speaker body character color')
    expect(coloredBody).toContain('color: var(--log-speaker-color);')
    expect(coloredBody).toContain('<span class="log-speaker">KP</span>')
    expect(coloredBody).toContain('<span class="log-speaker">GM</span>')
    expect(coloredBody).toContain('<span class="log-speaker">話者なし</span>')
    expect(coloredBody).not.toContain('log-entry--nameless-narration')
    expect(coloredBody).not.toContain('nameless narration guide marker')
    expect(coloredBody).not.toContain('speaker name after-line marker')
    expect(coloredBody).not.toContain('speaker name underline marker')
    expect(coloredBody).not.toContain('speaker body guide marker')
    for (const narrationHtml of [afterLine, bodyGuide, candidate]) {
      expect(narrationHtml).toContain('log-entry--nameless-narration')
      expect(narrationHtml).not.toContain('nameless narration guide marker')
    }
    expect(afterLine).toContain('speaker name after-line marker')
    expect(afterLine).toContain('display: inline-flex;')
    expect(afterLine).toContain('flex: 0 0 clamp(2rem, 8vw, 4.5rem);')
    expect(afterLine).toContain(
      'border-block-start: 2px solid var(--log-speaker-color);',
    )
    expect(afterLine).not.toContain('speaker body guide marker')
    expect(afterLine).not.toContain('speaker name underline marker')
    expect(bodyGuide).toContain('speaker body guide marker')
    expect(bodyGuide).toContain('.log-entry--speaker .log-messages::before')
    expect(bodyGuide).toContain('inset-inline-start: -.35rem;')
    expect(bodyGuide).toContain(
      'border-inline-start: 2px solid color-mix(in srgb, var(--log-speaker-color) 38%, transparent);',
    )
    expect(bodyGuide).not.toContain('margin-inline-start: .5rem;')
    expect(bodyGuide).not.toContain('padding-inline-start: .75rem;')
    expect(bodyGuide).not.toContain('nameless narration guide marker')
    expect(bodyGuide).not.toContain('speaker name after-line marker')
    expect(bodyGuide).not.toContain('speaker name underline marker')
    expect(candidate).toContain('speaker name underline marker')
    expect(candidate).not.toContain('speaker name after-line marker')
    expect(candidate).not.toContain('speaker body guide marker')
    expect(candidate).not.toContain('padding-block: .35rem;')
    expect(candidate).toContain('color: #555555;')
    expect(candidate).toContain('<h3 class="log-scene">場面：地下室前</h3>')
  })

  it('keeps the combined candidate readable in dark mode', () => {
    const candidate = buildCandidateCombinedComparisonHtml(
      buildComparisonModel(),
      {
        ...createDefaultSettings('comparison'),
        darkMode: true,
      },
    )

    expect(candidate).toContain('color: #d0d0d0;')
    expect(candidate).toContain('color: #b8b8b8;')
    expect(candidate).toContain(
      '.log-entry--scene .log-message {\n    color: #b8b8b8;',
    )
    expect(candidate).toContain('border-inline-start: 0;')
    expect(candidate).toContain(
      'linear-gradient(transparent 70%, rgba(127, 191, 255, 0.56) 0%)',
    )
    expect(candidate).toContain(
      'linear-gradient(transparent 70%, rgba(255, 127, 127, 0.58) 0%)',
    )
    expect(candidate).not.toContain(
      'linear-gradient(transparent 70%, #7fbfff 0%)',
    )
    expect(candidate).not.toContain(
      'linear-gradient(transparent 70%, #ff7f7f 0%)',
    )
    expect(candidate).not.toContain('rgba(127, 191, 255, 0.72)')
    expect(candidate).not.toContain('rgba(255, 127, 127, 0.74)')
  })
})

function readComparisonFixture(): string {
  return readFileSync(
    path.join(FIXTURE_DIR, 'coc6-output-visual-comparison.html'),
    'utf8',
  )
}

function buildComparisonModel() {
  const parsed = parseLogHtml(readComparisonFixture(), COC6_SYSTEM)
  return buildVisualComparisonOutputModel(parsed)
}

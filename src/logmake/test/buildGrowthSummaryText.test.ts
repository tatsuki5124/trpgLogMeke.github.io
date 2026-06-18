import { describe, expect, it } from 'vitest'

import { buildGrowthSummaryText } from '@/logmake/lib/buildGrowthSummaryText'
import type { GrowthAnalysis, GrowthFilters, GrowthRecord } from '@/logmake/types'

const record = (
  overrides: Partial<GrowthRecord> & Pick<GrowthRecord, 'label' | 'targetNames'>
): GrowthRecord => ({
  id: 'entry-0-dice-0-0-growth',
  roll: {
    id: 'entry-0-dice-0-0',
    entryId: 'entry-0',
    charName: '探索者A',
    tabName: 'メイン',
    value: 1,
    dice: {
      rawText: 'CCB&lt;=1 【目星】 (1D100&lt;=1) ＞ 1 ＞ 成功',
      command: 'CCB&lt;=1',
      outcomeText: '成功',
      primaryRoll: 1,
      rolls: [1],
      targets: [],
      status: false,
    },
  },
  status: false,
  initialSuccessTargetNames: [],
  targetKind: 'known',
  ...overrides,
})

const filters: GrowthFilters = {
  labels: {
    クリティカル: true,
    スペシャル: true,
    イクストリーム: true,
    ハード: true,
    ファンブル: true,
    故障: true,
    初期値成功: true,
    通常成功: true,
    通常失敗: true,
  },
  visibility: {
    tabName: true,
    value: true,
    status: true,
    unknownSkill: false,
  },
}

describe('buildGrowthSummaryText', () => {
  it('formats records by character and growth label order', () => {
    const analysis: GrowthAnalysis = {
      labels: ['クリティカル', '初期値成功'],
      warnings: [],
      records: [],
      byCharacter: {
        探索者A: {
          初期値成功: [
            record({
              targetNames: ['目星'],
              label: '初期値成功',
              roll: {
                ...record({ targetNames: ['目星'], label: '初期値成功' }).roll,
                value: 25,
              },
            }),
          ],
          クリティカル: [
            record({ targetNames: ['聞き耳'], label: 'クリティカル' }),
          ],
        },
      },
    }

    expect(buildGrowthSummaryText(analysis, filters, { メイン: true })).toBe(
      [
        '＜探索者A＞',
        '◯クリティカル',
        '[メイン] 聞き耳 ＞ 1',
        '',
        '◯初期値成功',
        '[メイン] 目星 ＞ 25',
      ].join('\n')
    )
  })

  it('applies label, tab, status, unknown skill, and column visibility filters', () => {
    const analysis: GrowthAnalysis = {
      labels: ['初期値成功', '通常成功', '通常失敗'],
      warnings: [],
      records: [],
      byCharacter: {
        探索者A: {
          初期値成功: [
            record({ targetNames: ['目星'], label: '初期値成功' }),
          ],
          通常成功: [
            record({
              targetNames: ['図書館'],
              label: '通常成功',
              roll: {
                ...record({ targetNames: ['図書館'], label: '通常成功' }).roll,
                tabName: '雑談',
                value: 42,
              },
            }),
          ],
          通常失敗: [
            record({
              targetNames: ['POW'],
              label: '通常失敗',
              status: true,
            }),
            record({
              targetNames: ['CBR(50,40)'],
              label: '通常失敗',
              targetKind: 'combination',
            }),
          ],
        },
      },
    }
    const nextFilters: GrowthFilters = {
      labels: {
        ...filters.labels,
        通常成功: false,
      },
      visibility: {
        tabName: false,
        value: false,
        status: false,
        unknownSkill: false,
      },
    }

    expect(
      buildGrowthSummaryText(analysis, nextFilters, {
        メイン: true,
        雑談: false,
      })
    ).toBe(['＜探索者A＞', '◯初期値成功', '目星'].join('\n'))
  })

  it('shows unknown skill records only when the option is enabled', () => {
    const analysis: GrowthAnalysis = {
      labels: ['通常失敗'],
      warnings: [],
      records: [],
      byCharacter: {
        探索者A: {
          通常失敗: [
            record({
              targetNames: ['1d100&lt;=50'],
              label: '通常失敗',
              targetKind: 'genericD100',
            }),
          ],
        },
      },
    }

    expect(buildGrowthSummaryText(analysis, filters, { メイン: true })).toBe('')
    expect(
      buildGrowthSummaryText(
        analysis,
        {
          ...filters,
          visibility: { ...filters.visibility, unknownSkill: true },
        },
        { メイン: true },
      )
    ).toBe(['＜探索者A＞', '◯通常失敗', '[メイン] 1d100&lt;=50 ＞ 1'].join('\n'))
  })

  it('returns an empty string when no records remain visible', () => {
    const analysis: GrowthAnalysis = {
      labels: ['通常成功'],
      warnings: [],
      records: [],
      byCharacter: {
        探索者A: {
          通常成功: [
            record({
              targetNames: ['図書館'],
              label: '通常成功',
              roll: {
                ...record({ targetNames: ['図書館'], label: '通常成功' }).roll,
                tabName: '雑談',
                value: 42,
              },
            }),
          ],
        },
      },
    }

    expect(buildGrowthSummaryText(analysis, filters, { 雑談: false })).toBe('')
  })
})

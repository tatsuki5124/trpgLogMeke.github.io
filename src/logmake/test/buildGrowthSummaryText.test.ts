import { describe, expect, it } from 'vitest'

import { buildGrowthSummaryText } from '@/logmake/lib/buildGrowthSummaryText'
import type { DiceRecord, GrowthAnalysis, GrowthFilters } from '@/logmake/types'

const record = (
  overrides: Partial<DiceRecord> & Pick<DiceRecord, 'ginou' | 'label'>
): DiceRecord => ({
  charName: '探索者A',
  tabName: 'メイン',
  value: 1,
  status: false,
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
            record({ ginou: '目星', label: '初期値成功', value: 25 }),
          ],
          クリティカル: [
            record({ ginou: '聞き耳', label: 'クリティカル', value: 1 }),
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

  it('applies label, tab, status, and column visibility filters', () => {
    const analysis: GrowthAnalysis = {
      labels: ['初期値成功', '通常成功', '通常失敗'],
      warnings: [],
      records: [],
      byCharacter: {
        探索者A: {
          初期値成功: [
            record({ ginou: '目星', label: '初期値成功', value: 25 }),
          ],
          通常成功: [
            record({
              ginou: '図書館',
              label: '通常成功',
              tabName: '雑談',
              value: 42,
            }),
          ],
          通常失敗: [
            record({
              ginou: 'POW',
              label: '通常失敗',
              status: true,
              value: 60,
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
      },
    }

    expect(
      buildGrowthSummaryText(analysis, nextFilters, {
        メイン: true,
        雑談: false,
      })
    ).toBe(['＜探索者A＞', '◯初期値成功', '目星'].join('\n'))
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
              ginou: '図書館',
              label: '通常成功',
              tabName: '雑談',
              value: 42,
            }),
          ],
        },
      },
    }

    expect(buildGrowthSummaryText(analysis, filters, { 雑談: false })).toBe('')
  })
})

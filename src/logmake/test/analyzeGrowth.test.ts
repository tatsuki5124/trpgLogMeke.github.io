import { readFileSync } from 'fs'
import path from 'path'

import { describe, expect, it } from 'vitest'

import { analyzeDiceRolls } from '@/logmake/lib/analyzeDiceRolls'
import { analyzeGrowth } from '@/logmake/lib/analyzeGrowth'
import { parseLogHtml } from '@/logmake/lib/parseLogHtml'
import { graphBuckets } from '@/logmake/lib/graphBuckets'
import { getLogmakeSystem } from '@/logmake/systems'
import type { LogmakeSystem } from '@/logmake/systems'

const FIXTURE_DIR = path.resolve(__dirname, 'fixtures')
const COC6_SYSTEM = getLogmakeSystem('CoC6')
const COC7_SYSTEM = getLogmakeSystem('CoC7')

describe('analyzeGrowth', () => {
  it('classifies initial success, critical, and fumble in CoC6', () => {
    const html = readFileSync(path.join(FIXTURE_DIR, 'coc6-sample.html'), 'utf8')
    const parsed = parseLogHtml(html, COC6_SYSTEM)
    const rollAnalysis = analyzeDiceRolls(parsed)
    const analysis = analyzeGrowth(rollAnalysis, COC6_SYSTEM, { 目星: 25 })

    expect(analysis.byCharacter['探索者A']?.['初期値成功']).toHaveLength(2)
    expect(analysis.byCharacter['探索者A']?.['クリティカル']).toHaveLength(1)
    expect(analysis.byCharacter['探索者A']?.['ファンブル']).toHaveLength(1)
    expect(graphBuckets(rollAnalysis.records)[19]).toBe(1)
  })

  it('classifies hard, extreme, and initial success in CoC7', () => {
    const html = readFileSync(path.join(FIXTURE_DIR, 'coc7-sample.html'), 'utf8')
    const parsed = parseLogHtml(html, COC7_SYSTEM)
    const analysis = analyzeGrowth(analyzeDiceRolls(parsed), COC7_SYSTEM, { 聞き耳: 20 })

    expect(analysis.byCharacter['探索者B']?.['ハード']).toHaveLength(1)
    expect(analysis.byCharacter['探索者B']?.['イクストリーム']).toHaveLength(1)
    expect(analysis.byCharacter['探索者B']?.['初期値成功']).toHaveLength(1)
  })

  it('uses CoC7 difficulty suffixes even when BCDice output says success', () => {
    const html = readFileSync(
      path.join(FIXTURE_DIR, 'coc7-repeat-and-cbr.html'),
      'utf8'
    )
    const parsed = parseLogHtml(html, COC7_SYSTEM)
    const analysis = analyzeGrowth(analyzeDiceRolls(parsed), COC7_SYSTEM, {})

    expect(analysis.byCharacter['探索者B']?.['イクストリーム']).toHaveLength(2)
    expect(analysis.byCharacter['探索者B']?.['ハード']).toHaveLength(2)
    expect(analysis.byCharacter['探索者B']?.['通常失敗']).toHaveLength(3)
  })

  it('includes combination rolls and malfunction checks in growth records', () => {
    const html = readFileSync(
      path.join(FIXTURE_DIR, 'coc6-growth-and-bcdice.html'),
      'utf8'
    )
    const parsed = parseLogHtml(html, COC6_SYSTEM)
    const analysis = analyzeGrowth(analyzeDiceRolls(parsed), COC6_SYSTEM, {
      目星: 25,
      'こぶし（パンチ）': 50,
      マーシャルアーツ: 45,
      組み付き: 25,
    })
    expect(analysis.byCharacter['探索者A']?.['初期値成功']).toHaveLength(4)
    expect(analysis.byCharacter['探索者A']?.['クリティカル']).toHaveLength(1)
    expect(analysis.byCharacter['探索者A']?.['ファンブル']).toHaveLength(2)
    expect(analysis.byCharacter['探索者A']?.['通常成功']).toHaveLength(2)
    expect(analysis.byCharacter['探索者A']?.['通常失敗']).toHaveLength(1)
    expect(analysis.byCharacter['探索者A']?.['故障']).toHaveLength(1)
    expect(analysis.records).toHaveLength(11)
    expect(
      analysis.records.every((record) => record.targetNames.join(', ') !== '')
    ).toBe(true)
    expect(analysis.records.flatMap((record) => record.targetNames)).toEqual(
      expect.arrayContaining([
        'こぶし（パンチ）',
        'マーシャルアーツ',
        '組み付き',
        '【攻撃】対象：XX',
        '拳銃',
      ])
    )
    expect(
      analysis.records.find((record) =>
        record.targetNames.includes('マーシャルアーツ')
      )?.initialSuccessTargetNames
    ).toEqual(['マーシャルアーツ'])
    expect(
      analysis.records.find((record) =>
        record.roll.dice.outcomeText.includes('部分的成功')
      )?.initialSuccessTargetNames
    ).toEqual(['こぶし（パンチ）'])
  })

  it('classifies generic 1d100 and no-target CBR target kinds', () => {
    const html = `
      <!DOCTYPE html>
      <html lang="ja">
        <body>
          <p style="color:#228b22;">
            <span>[main]</span><span>探索者A</span> :
            <span>1d100&lt;=50 【正気度ロール】 (1D100&lt;=50) ＞ 89 ＞ 失敗</span>
          </p>
          <p style="color:#228b22;">
            <span>[main]</span><span>探索者A</span> :
            <span>1d100&lt;=50 (1D100&lt;=50) ＞ 89 ＞ 失敗</span>
          </p>
          <p style="color:#228b22;">
            <span>[main]</span><span>探索者A</span> :
            <span>CBR(50,40) ＞ 73[失敗,失敗] ＞ 失敗</span>
          </p>
        </body>
      </html>
    `
    const parsed = parseLogHtml(html, COC6_SYSTEM)
    const analysis = analyzeGrowth(analyzeDiceRolls(parsed), COC6_SYSTEM, {})

    expect(analysis.records.map((record) => record.targetKind)).toEqual([
      'known',
      'genericD100',
      'combination',
    ])
  })

  it('includes secret dice in growth records and classifies secret command target kinds', () => {
    const html = `
      <!DOCTYPE html>
      <html lang="ja">
        <body>
          <p style="color:#228b22;">
            <span>[main]</span><span>探索者A</span> :
            <span>sCCB&lt;=25 【目星】 (1D100&lt;=25) ＞ 17 ＞ 成功</span>
          </p>
          <p style="color:#228b22;">
            <span>[main]</span><span>探索者A</span> :
            <span>sRESB(12-10) ＞ 35 ＞ 成功</span>
          </p>
          <p style="color:#228b22;">
            <span>[main]</span><span>探索者A</span> :
            <span>sCBR(50,40) ＞ 73[失敗,失敗] ＞ 失敗</span>
          </p>
        </body>
      </html>
    `
    const analysis = analyzeGrowth(
      analyzeDiceRolls(parseLogHtml(html, COC6_SYSTEM)),
      COC6_SYSTEM,
      { 目星: 25 }
    )

    expect(analysis.records.map((record) => record.label)).toEqual([
      '初期値成功',
      '通常成功',
      '通常失敗',
    ])
    expect(analysis.records.map((record) => record.targetKind)).toEqual([
      'known',
      'resistance',
      'combination',
    ])
  })

  it('does not crash or infer initial success when CBRB part outcomes are missing', () => {
    const dice = COC6_SYSTEM.log.parseToken(
      'CBRB(50,25) こぶし,組み付き ＞ 30 ＞ 部分的成功'
    )
    expect(dice).toBeDefined()
    const rollAnalysis = {
      records: [
        {
          id: 'entry-0-dice-0-0',
          entryId: 'entry-0',
          charName: '探索者A',
          tabName: 'メイン',
          value: 30,
          dice: dice!,
        },
      ],
      byCharacter: {},
      warnings: [],
    }

    const analysis = analyzeGrowth(rollAnalysis, COC6_SYSTEM, {
      'こぶし（パンチ）': 50,
      組み付き: 25,
    })

    expect(analysis.records[0]?.initialSuccessTargetNames).toEqual([])
  })

  it('returns empty growth analysis for systems without growth capability', () => {
    const html = readFileSync(path.join(FIXTURE_DIR, 'coc6-sample.html'), 'utf8')
    const systemWithoutGrowth: LogmakeSystem = {
      ...COC6_SYSTEM,
      growth: undefined,
    }
    const parsed = parseLogHtml(html, systemWithoutGrowth)
    const analysis = analyzeGrowth(analyzeDiceRolls(parsed), systemWithoutGrowth, {})

    expect(analysis.labels).toEqual([])
    expect(analysis.records).toEqual([])
    expect(analysis.byCharacter).toEqual({})
  })
})

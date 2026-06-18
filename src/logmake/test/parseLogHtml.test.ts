import { readFileSync } from 'fs'
import path from 'path'

import { describe, expect, it } from 'vitest'

import { parseLogHtml } from '@/logmake/lib/parseLogHtml'
import { getLogmakeSystem } from '@/logmake/systems'

const FIXTURE_DIR = path.resolve(__dirname, 'fixtures')
const COC6_SYSTEM = getLogmakeSystem('CoC6')
const COC7_SYSTEM = getLogmakeSystem('CoC7')

describe('parseLogHtml', () => {
  it('parses entries, tabs, characters, and expands x-roll lines', () => {
    const html = readFileSync(
      path.join(FIXTURE_DIR, 'coc6-sample.html'),
      'utf8'
    )
    const parsed = parseLogHtml(html, COC6_SYSTEM)

    expect(parsed.entries).toHaveLength(3)
    expect(Object.keys(parsed.tabs)).toEqual(['メイン', '情報', '雑談'])
    expect(parsed.characters['探索者A']?.style).toBe('character')
    expect(parsed.characters['古文書']?.style).toBe('item')
    expect(parsed.entries[1].paragraphs[0].tokens).toHaveLength(3)
    expect(
      parsed.entries[1].paragraphs[0].tokens[1].dice?.targets[0]?.name
    ).toBe('目星')
    expect(parsed.warnings).toHaveLength(0)
  })

  it('parses loose span markup and nested content with DOMParser', () => {
    const html = readFileSync(
      path.join(FIXTURE_DIR, 'coc6-dom-variant.html'),
      'utf8'
    )
    const parsed = parseLogHtml(html, COC6_SYSTEM)

    expect(parsed.entries).toHaveLength(2)
    expect(parsed.entries[0]).toMatchObject({
      tabName: 'メイン',
      charName: '探索者C',
      charColor: '#123abc',
    })
    expect(parsed.entries[0].paragraphs).toHaveLength(2)
    expect(
      parsed.entries[0].paragraphs[0].tokens[0].dice?.targets[0]?.name
    ).toBe('目星')
    expect(parsed.entries[1].sourceHtml).toContain('<span>差出人不明</span>')
    expect(parsed.characters['手紙']?.style).toBe('item')
    expect(parsed.warnings).toHaveLength(0)
  })

  it('parses CoC7 bonus dice results', () => {
    const html = readFileSync(
      path.join(FIXTURE_DIR, 'coc7-sample.html'),
      'utf8'
    )
    const parsed = parseLogHtml(html, COC7_SYSTEM)

    expect(parsed.entries).toHaveLength(1)
    expect(parsed.entries[0].paragraphs[0].tokens[0].dice).toMatchObject({
      targets: [{ name: '目星' }],
      primaryRoll: 10,
      outcomeText: 'ハード成功',
    })
  })

  it('returns a warning when no CCFOLIA log entries are found', () => {
    const parsed = parseLogHtml(
      '<html><body><p>no log</p></body></html>',
      COC6_SYSTEM
    )

    expect(parsed.entries).toHaveLength(0)
    expect(parsed.warnings).toEqual([
      'ログ形式を解析できませんでした。CCFOLIA出力HTMLか、対象範囲の形式を確認してください。',
    ])
  })

  it('normalizes repeated skill dice and parses BCDice command results', () => {
    const html = readFileSync(
      path.join(FIXTURE_DIR, 'coc6-growth-and-bcdice.html'),
      'utf8'
    )
    const parsed = parseLogHtml(html, COC6_SYSTEM)
    const repeatedTokens = parsed.entries[0].paragraphs[0].tokens
    const commandEntries = parsed.entries.slice(1)
    const commandTokens = commandEntries.flatMap(
      (entry) => entry.paragraphs[0].tokens
    )
    const cbrToken = commandTokens.find((token) =>
      token.content.includes('CBR(80,45)')
    )
    const partialToken = commandTokens.find((token) =>
      token.content.includes('部分的成功')
    )
    const fallbackToken = commandTokens.find((token) =>
      token.content.includes('対象：XX')
    )
    const malfunctionToken = commandTokens.find((token) =>
      token.content.includes('＞ 95 ＞ 故障')
    )

    expect(parsed.entries).toHaveLength(9)
    expect(
      commandEntries.every((entry) => entry.paragraphs[0].tokens.length === 1)
    ).toBe(true)
    expect(repeatedTokens).toHaveLength(4)
    expect(repeatedTokens[1].dice).toMatchObject({
      command: 'CCB&lt;=25',
      targets: [{ name: '目星' }],
      primaryRoll: 17,
      outcomeText: '成功',
      highlight: 'success',
    })
    expect(repeatedTokens[3].dice).toMatchObject({
      primaryRoll: 100,
      outcomeText: '致命的失敗',
      highlight: 'failure',
    })
    expect(commandTokens[0].dice).toMatchObject({
      targets: [],
      primaryRoll: 35,
      outcomeText: '成功',
      highlight: 'success',
    })
    expect(commandTokens[1].dice).toMatchObject({
      targets: [],
      primaryRoll: 73,
      outcomeText: '失敗',
      highlight: 'failure',
    })
    expect(cbrToken?.dice?.targets).toEqual([
      {
        name: 'こぶし（パンチ）',
        judge: '&lt;=80 【こぶし（パンチ）】',
        outcomeText: '成功',
        target: 80,
      },
      {
        name: 'マーシャルアーツ',
        judge: '&lt;=45 【マーシャルアーツ】',
        outcomeText: '成功',
        target: 45,
      },
    ])
    expect(partialToken?.dice?.targets).toEqual([
      {
        name: 'こぶし（パンチ）',
        judge: '&lt;=50 【こぶし（パンチ）】',
        outcomeText: '成功',
        target: 50,
      },
      {
        name: '組み付き',
        judge: '&lt;=25 【組み付き】',
        outcomeText: '失敗',
        target: 25,
      },
    ])
    expect(fallbackToken?.dice?.targets).toEqual([
      { name: '【攻撃】対象：XX', judge: null },
    ])
    expect(malfunctionToken?.dice).toMatchObject({
      targets: [{ name: '拳銃', judge: '&lt;=60 【拳銃】', target: 60 }],
      primaryRoll: 95,
      outcomeText: '故障',
    })
    expect(malfunctionToken?.highlight).toBeUndefined()
  })

  it('keeps omikuji as text-only content', () => {
    const html = readFileSync(
      path.join(FIXTURE_DIR, 'coc6-omikuji.html'),
      'utf8'
    )
    const parsed = parseLogHtml(html, COC6_SYSTEM)
    const tokens = parsed.entries[0].paragraphs[0].tokens

    expect(tokens).toHaveLength(2)
    expect(tokens.every((token) => token.dice === undefined)).toBe(true)
    expect(tokens.map((token) => token.content.trim())).toEqual([
      '今日のあなたの運勢は……？',
      '【大吉】',
    ])
  })

  it('normalizes BCDice repeat aliases in CoC7 logs', () => {
    const html = readFileSync(
      path.join(FIXTURE_DIR, 'coc7-repeat-and-cbr.html'),
      'utf8'
    )
    const parsed = parseLogHtml(html, COC7_SYSTEM)
    const repeatedTokens = parsed.entries[0].paragraphs[0].tokens

    expect(repeatedTokens).toHaveLength(3)
    expect(repeatedTokens[1].dice).toMatchObject({
      targets: [{ name: '目星' }],
      primaryRoll: 10,
      outcomeText: 'ハード成功',
      meta: { cocOption: 'h' },
    })
    expect(parsed.entries[1].paragraphs[0].tokens[0].dice).toMatchObject({
      targets: [],
      primaryRoll: 100,
      outcomeText: 'ファンブル',
      highlight: 'failure',
    })
  })

  it('parses CoC7 bonus/penalty dice notation and difficulty suffixes', () => {
    const html = readFileSync(
      path.join(FIXTURE_DIR, 'coc7-repeat-and-cbr.html'),
      'utf8'
    )
    const parsed = parseLogHtml(html, COC7_SYSTEM)
    const dice = parsed.entries
      .slice(2)
      .map((entry) => entry.paragraphs[0].tokens[0].dice)

    expect(dice).toHaveLength(5)
    expect(dice[0]).toMatchObject({
      primaryRoll: 81,
      meta: { cocOption: 'r' },
      outcomeText: '失敗',
    })
    expect(dice[1]).toMatchObject({
      primaryRoll: 13,
      meta: { cocOption: 'e' },
      outcomeText: '成功',
    })
    expect(dice[2]).toMatchObject({
      primaryRoll: 62,
      meta: { cocOption: 'h' },
      outcomeText: '失敗',
    })
    expect(dice[3]).toMatchObject({
      primaryRoll: 3,
      meta: { cocOption: 'h' },
      outcomeText: '成功',
    })
    expect(dice[4]).toMatchObject({
      primaryRoll: 63,
      meta: { cocOption: 'e' },
      outcomeText: '失敗',
    })
  })

  it('parses generic 1d100 results with and without target names', () => {
    const html = `
      <!DOCTYPE html>
      <html lang="ja">
        <body>
          <p style="color:#228b22;">
            <span>[main]</span><span>探索者A</span> :
            <span>1d100&lt;=50 (1D100&lt;=50) ＞ 89 ＞ 失敗</span>
          </p>
          <p style="color:#228b22;">
            <span>[main]</span><span>探索者A</span> :
            <span>1d100&lt;=50 【正気度ロール】 (1D100&lt;=50) ＞ 89 ＞ 失敗</span>
          </p>
        </body>
      </html>
    `
    const dice = parseLogHtml(html, COC6_SYSTEM).entries.map(
      (entry) => entry.paragraphs[0].tokens[0].dice
    )

    expect(dice[0]).toMatchObject({
      command: '1d100&lt;=50',
      targets: [],
      primaryRoll: 89,
      outcomeText: '失敗',
    })
    expect(dice[1]).toMatchObject({
      command: '1d100&lt;=50',
      targets: [{ name: '正気度ロール', target: 50 }],
      primaryRoll: 89,
      outcomeText: '失敗',
      status: true,
    })
  })

  it('parses secret CoC dice commands', () => {
    const html = `
      <!DOCTYPE html>
      <html lang="ja">
        <body>
          <p style="color:#228b22;">
            <span>[main]</span><span>探索者A</span> :
            <span>sCCB&lt;=50 【目星】 (1D100&lt;=50) ＞ 30 ＞ 成功</span>
          </p>
          <p style="color:#228b22;">
            <span>[main]</span><span>探索者A</span> :
            <span>sRESB(12-10) ＞ 35 ＞ 成功</span>
          </p>
          <p style="color:#228b22;">
            <span>[main]</span><span>探索者A</span> :
            <span>sCBRB(50,25) こぶし,組み付き ＞ 30[成功,失敗] ＞ 部分的成功</span>
          </p>
        </body>
      </html>
    `
    const dice = parseLogHtml(html, COC6_SYSTEM).entries.map(
      (entry) => entry.paragraphs[0].tokens[0].dice
    )

    expect(dice[0]).toMatchObject({
      command: 'sCCB&lt;=50',
      targets: [{ name: '目星', target: 50 }],
      primaryRoll: 30,
      outcomeText: '成功',
    })
    expect(dice[1]).toMatchObject({
      command: 'sRESB(12-10)',
      targets: [],
      primaryRoll: 35,
      outcomeText: '成功',
    })
    expect(dice[2]?.targets).toEqual([
      {
        name: 'こぶし（パンチ）',
        judge: '&lt;=50 【こぶし（パンチ）】',
        outcomeText: '成功',
        target: 50,
      },
      {
        name: '組み付き',
        judge: '&lt;=25 【組み付き】',
        outcomeText: '失敗',
        target: 25,
      },
    ])
  })

  it('uses system rules to distinguish CoC6-only and CoC7 commands', () => {
    const html = `
      <!DOCTYPE html>
      <html lang="ja">
        <body>
          <p style="color:#3366cc;">
            <span>[main]</span><span>探索者B</span> :
            <span>CCB&lt;=50 【目星】 (1D100&lt;=50) ＞ 12 ＞ 成功</span>
          </p>
          <p style="color:#3366cc;">
            <span>[main]</span><span>探索者B</span> :
            <span>CC&lt;=50 【目星】 (1D100&lt;=50) ボーナス・ペナルティダイス[0] ＞ 12 ＞ 12 ＞ 成功</span>
          </p>
          <p style="color:#3366cc;">
            <span>[main]</span><span>探索者B</span> :
            <span>CBRB(50,25) こぶし,MA ＞ 20[成功,成功] ＞ 成功</span>
          </p>
          <p style="color:#3366cc;">
            <span>[main]</span><span>探索者B</span> :
            <span>CBR(50,25) こぶし,MA ＞ 20[成功,成功] ＞ 成功</span>
          </p>
        </body>
      </html>
    `

    const coc6Dice = parseLogHtml(html, COC6_SYSTEM).entries.map(
      (entry) => entry.paragraphs[0].tokens[0].dice
    )
    const coc7Dice = parseLogHtml(html, COC7_SYSTEM).entries.map(
      (entry) => entry.paragraphs[0].tokens[0].dice
    )

    expect(coc6Dice.map(Boolean)).toEqual([true, true, true, true])
    expect(coc7Dice.map(Boolean)).toEqual([false, true, false, true])
  })

  it('treats malformed or incomplete dice fragments as plain text (no NaN in primaryRoll)', () => {
    const html = `
      <!DOCTYPE html>
      <html lang="ja">
        <body>
          <p style="color:#3366cc;">
            <span>[main]</span><span>探索者A</span> :
            <span>CC&lt;=50 【目星】</span>
          </p>
          <p style="color:#3366cc;">
            <span>[main]</span><span>探索者A</span> :
            <span>CCB&lt;=50 (1D100&lt;=50) ＞ 成功</span>
          </p>
        </body>
      </html>
    `
    const parsed = parseLogHtml(html, COC6_SYSTEM)
    const allDice = parsed.entries.flatMap((entry) =>
      entry.paragraphs.flatMap((p) => p.tokens.map((t) => t.dice))
    )

    for (const dice of allDice) {
      if (dice !== undefined) {
        expect(Number.isNaN(dice.primaryRoll)).toBe(false)
      }
    }
  })

  it('marks only exact status target names as status-dependent records', () => {
    const html = `
      <!DOCTYPE html>
      <html lang="ja">
        <body>
          <p style="color:#3366cc;">
            <span>[main]</span><span>探索者A</span> :
            <span>CCB&lt;=60 【図書館】 (1D100&lt;=60) ＞ 30 ＞ 成功 知識の断片</span>
          </p>
          <p style="color:#3366cc;">
            <span>[main]</span><span>探索者A</span> :
            <span>CCB&lt;=60 【POW】 (1D100&lt;=60) ＞ 30 ＞ 成功</span>
          </p>
        </body>
      </html>
    `
    const dice = parseLogHtml(html, COC6_SYSTEM).entries.map(
      (entry) => entry.paragraphs[0].tokens[0].dice
    )

    expect(dice[0]).toMatchObject({
      targets: [{ name: '図書館' }],
      status: false,
    })
    expect(dice[1]).toMatchObject({
      targets: [{ name: 'POW' }],
      status: true,
    })
  })
})

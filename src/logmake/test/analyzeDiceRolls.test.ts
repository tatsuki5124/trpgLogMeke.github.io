import { describe, expect, it } from 'vitest'

import { analyzeDiceRolls } from '@/logmake/lib/analyzeDiceRolls'
import { parseLogHtml } from '@/logmake/lib/parseLogHtml'
import { getLogmakeSystem } from '@/logmake/systems'

const COC6_SYSTEM = getLogmakeSystem('CoC6')
const COC7_SYSTEM = getLogmakeSystem('CoC7')

describe('analyzeDiceRolls', () => {
  it('includes RESB, CBR, and CBRB as one adopted roll each', () => {
    const html = `
      <!DOCTYPE html>
      <html lang="ja">
        <body>
          <p style="color:#228b22;">
            <span>[main]</span><span>探索者A</span> :
            <span>RESB(12-10) ＞ 35 ＞ 成功</span>
          </p>
          <p style="color:#228b22;">
            <span>[main]</span><span>探索者A</span> :
            <span>CBR(50,40) ＞ 73[失敗,失敗] ＞ 失敗</span>
          </p>
          <p style="color:#228b22;">
            <span>[main]</span><span>探索者A</span> :
            <span>CBRB(50,25) こぶし,組み付き ＞ 20[成功,成功] ＞ 成功</span>
          </p>
        </body>
      </html>
    `

    const analysis = analyzeDiceRolls(parseLogHtml(html, COC6_SYSTEM))

    expect(analysis.records.map((record) => record.value)).toEqual([35, 73, 20])
    expect(analysis.records.map((record) => record.dice.command)).toEqual([
      'RESB(12-10)',
      'CBR(50,40)',
      'CBRB(50,25)',
    ])
    expect(analysis.byCharacter['探索者A']).toHaveLength(3)
  })

  it('uses only the adopted primaryRoll for CoC7 bonus and penalty dice', () => {
    const html = `
      <!DOCTYPE html>
      <html lang="ja">
        <body>
          <p style="color:#3366cc;">
            <span>[main]</span><span>探索者B</span> :
            <span>CC+3&lt;=70e 【目星】 (1D100&lt;=14) ボーナス・ペナルティダイス[3] ＞ 63, 73, 33, 13 ＞ 13 ＞ 成功</span>
          </p>
        </body>
      </html>
    `

    const analysis = analyzeDiceRolls(parseLogHtml(html, COC7_SYSTEM))

    expect(analysis.records).toHaveLength(1)
    expect(analysis.records[0]).toMatchObject({
      charName: '探索者B',
      tabName: 'メイン',
      value: 13,
    })
  })

  it('expands RESB, CBR, CBRB, and secret multi-roll blocks', () => {
    const html = `
      <!DOCTYPE html>
      <html lang="ja">
        <body>
          <p style="color:#228b22;">
            <span>[main]</span><span>探索者A</span> :
            <span>x2 RESB(12-10) #1
35 ＞ 成功

#2
73 ＞ 失敗</span>
          </p>
          <p style="color:#228b22;">
            <span>[main]</span><span>探索者A</span> :
            <span>x2 CBR(50,40) #1
35[成功,成功] ＞ 成功

#2
73[失敗,失敗] ＞ 失敗</span>
          </p>
          <p style="color:#228b22;">
            <span>[main]</span><span>探索者A</span> :
            <span>x2 sCBRB(50,25) こぶし,組み付き #1
20[成功,成功] ＞ 成功

#2
30[成功,失敗] ＞ 部分的成功</span>
          </p>
          <p style="color:#228b22;">
            <span>[main]</span><span>探索者A</span> :
            <span>x2 sCCB&lt;=50 【目星】 #1
(1D100&lt;=50) ＞ 30 ＞ 成功

#2
(1D100&lt;=50) ＞ 80 ＞ 失敗</span>
          </p>
        </body>
      </html>
    `

    const analysis = analyzeDiceRolls(parseLogHtml(html, COC6_SYSTEM))

    expect(analysis.records.map((record) => record.value)).toEqual([
      35,
      73,
      35,
      73,
      20,
      30,
      30,
      80,
    ])
    expect(analysis.records.map((record) => record.dice.command)).toEqual([
      'RESB(12-10)',
      'RESB(12-10)',
      'CBR(50,40)',
      'CBR(50,40)',
      'sCBRB(50,25)',
      'sCBRB(50,25)',
      'sCCB&lt;=50',
      'sCCB&lt;=50',
    ])
  })
})

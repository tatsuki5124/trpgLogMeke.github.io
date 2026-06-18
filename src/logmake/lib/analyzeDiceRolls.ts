import type { DiceRollAnalysis, DiceRollRecord, ParsedLog } from '@/logmake/types'

/**
 * パース済みログから、採用出目1件ごとのレコードを抽出する。
 * 成長対象かどうかや技能名の有無では除外せず、primaryRoll が 1d100 の範囲にあるイベントだけを扱う。
 *
 * @param parsedLog - parseLogHtml の戻り値
 * @returns グラフや成長判定の土台になる出目分析結果
 */
export function analyzeDiceRolls(parsedLog: ParsedLog): DiceRollAnalysis {
  const records: DiceRollRecord[] = []
  const byCharacter: DiceRollAnalysis['byCharacter'] = {}

  parsedLog.entries.forEach((entry) => {
    entry.paragraphs.forEach((paragraph, paragraphIndex) => {
      paragraph.tokens.forEach((token, tokenIndex) => {
        const dice = token.dice
        if (!dice || !isValidPrimaryRoll(dice.primaryRoll)) {
          return
        }

        const record: DiceRollRecord = {
          id: `${entry.id}-dice-${paragraphIndex}-${tokenIndex}`,
          entryId: entry.id,
          charName: entry.charName,
          tabName: entry.tabName,
          value: dice.primaryRoll,
          dice,
        }

        records.push(record)
        byCharacter[record.charName] ??= []
        byCharacter[record.charName].push(record)
      })
    })
  })

  return {
    records,
    byCharacter,
    warnings: [...parsedLog.warnings],
  }
}

function isValidPrimaryRoll(value: number | null): value is number {
  return value !== null && Number.isInteger(value) && value >= 1 && value <= 100
}

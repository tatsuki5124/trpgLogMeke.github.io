import type { DefaultSkillValueMap } from '@/logmake/lib/defaultSkillValues'
import type { LogmakeSystem } from '@/logmake/systems'
import type { DiceRollAnalysis, GrowthAnalysis, GrowthRecord } from '@/logmake/types'

/**
 * 採用出目分析結果から成長判定レコードを集約し、分析結果を返す。
 * system.growth が未定義のシステムでは空の分析結果を返す。
 *
 * @param rollAnalysis - analyzeDiceRolls の戻り値
 * @param system - 使用するゲームシステム（成長判定ロジックを保持）
 * @param defaultSkillValues - 初期値成功の判定に使う技能初期値マップ
 * @returns 成長判定の集約結果
 */
export function analyzeGrowth(
  rollAnalysis: DiceRollAnalysis,
  system: LogmakeSystem,
  defaultSkillValues: DefaultSkillValueMap,
): GrowthAnalysis {
  const growth = system.growth
  const labels = growth?.labels ?? []
  const byCharacter: GrowthAnalysis['byCharacter'] = {}
  const records: GrowthRecord[] = []
  const warnings = [...rollAnalysis.warnings]

  if (!growth) {
    return { labels, byCharacter, records, warnings }
  }

  for (const roll of rollAnalysis.records) {
    const classification = growth.classifyEvent({
      defaultSkillValues,
      dice: roll.dice,
    })
    if (!classification) {
      continue
    }

    const record: GrowthRecord = {
      id: `${roll.id}-growth`,
      roll,
      ...classification,
    }

    byCharacter[roll.charName] ??= {}
    byCharacter[roll.charName][record.label] ??= []
    byCharacter[roll.charName][record.label]?.push(record)
    records.push(record)
  }

  return { labels, byCharacter, records, warnings }
}

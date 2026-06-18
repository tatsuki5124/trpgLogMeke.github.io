import rawDefaultSkillValues from '@/logmake/systems/data/defaultSkillValues6th.json'
import { createLogSourceNormalizer } from '@/logmake/lib/normalizeSourceHtml'
import { createCocDiceExtractor } from '@/logmake/systems/coc/cocDiceExtractor'
import { createCocGrowth } from '@/logmake/systems/coc/cocGrowth'
import type { LogmakeSystem } from '@/logmake/systems/types'

/** CoC6版で使用する技能の表記ゆれを正規名に統一するエイリアスマップ */
const SKILL_ALIASES: Record<string, string> = {
  ma: 'マーシャルアーツ',
  パンチ: 'こぶし（パンチ）',
  こぶし: 'こぶし（パンチ）',
  こぶしパンチ: 'こぶし（パンチ）',
  'こぶし（パンチ）': 'こぶし（パンチ）',
  マーシャルアーツ: 'マーシャルアーツ',
}

const parseCoc6DiceToken = createCocDiceExtractor({
  commandPrefix: '(?:S?(?:CCB|CC|RESB|RES|CBRB|CBR))',
  optionRegex: /S?(?:CCB|CC|RESB|RES|CBRB|CBR)[-+0-9()]*(?:&lt;=|<=)\d+([crhe])/i,
  combineCommandPattern: /^S?CBRB?\((\d+)\s*,\s*(\d+)\)/i,
  skillAliases: SKILL_ALIASES,
})

const coc6Growth = createCocGrowth({
  labels: [
    'クリティカル',
    'スペシャル',
    'ファンブル',
    '故障',
    '初期値成功',
    '通常成功',
    '通常失敗',
  ],
  rawDefaultSkillValues,
  successRegex: /スペシャル|成功/,
  classifyRefinedSuccess({ outcome }) {
    if (/スペシャル/.test(outcome)) {
      return 'スペシャル'
    }
    return '通常成功'
  },
})

/** CoC6版のゲームシステム定義 */
export const COC6_SYSTEM: LogmakeSystem = {
  id: 'CoC6',
  name: 'CoC 6版',
  log: {
    normalizeSource: createLogSourceNormalizer({
      multiRollRegex:
        /(?:x|rep|repeat)\d+( |\u3000)(S?(?:CCB|CC|RESB|RES|CBRB|CBR))(.*)\s+#\d+\n(.*)(\n\n+#\d+\n(.*))+(クリティカル|決定的成功|スペシャル|成功|失敗|ファンブル|致命的失敗|部分的成功)/gi,
      skillMultiRollRegex:
        /(?:x|rep|repeat)\d+( |\u3000)(S?(?:CCB|CC|RESB|RES|CBRB|CBR))[-+0-9()]*(?:&lt;=|<=)(\d+[crhe]*) 【(.*)】\s+#\d+\n/i,
    }),
    parseToken: parseCoc6DiceToken,
  },
  growth: coc6Growth,
}

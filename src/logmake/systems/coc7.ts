import rawDefaultSkillValues from '@/logmake/systems/data/defaultSkillValues7th.json'
import { createLogSourceNormalizer } from '@/logmake/lib/normalizeSourceHtml'
import { createCocDiceExtractor } from '@/logmake/systems/coc/cocDiceExtractor'
import { createCocGrowth } from '@/logmake/systems/coc/cocGrowth'
import type { LogmakeSystem } from '@/logmake/systems/types'

const parseCoc7DiceToken = createCocDiceExtractor({
  commandPrefix: '(?:S?(?:CC(?!B)|CBR(?!B)))',
  optionRegex: /S?(?:CC(?!B)|CBR(?!B))[-+0-9()]*(?:&lt;=|<=)\d+([rhec])/i,
  combineCommandPattern: /^S?CBR\((\d+)\s*,\s*(\d+)\)/i,
  skillAliases: {},
})

const coc7Growth = createCocGrowth({
  labels: [
    'クリティカル',
    'イクストリーム',
    'ハード',
    'ファンブル',
    '故障',
    '初期値成功',
    '通常成功',
    '通常失敗',
  ],
  rawDefaultSkillValues,
  successRegex: /イクストリーム成功|ハード成功|成功/,
  classifyRefinedSuccess({ outcome, cocOption }) {
    if (/イクストリーム成功/.test(outcome) || cocOption === 'e') {
      return 'イクストリーム'
    }
    if (/ハード成功/.test(outcome) || cocOption === 'h') {
      return 'ハード'
    }
    return '通常成功'
  },
})

export const COC7_SYSTEM: LogmakeSystem = {
  id: 'CoC7',
  name: 'CoC 7版',
  log: {
    normalizeSource: createLogSourceNormalizer({
      multiRollRegex:
        /(?:x|rep|repeat)\d+( |\u3000)(S?(?:CC(?!B)|CBR(?!B)))(.*)\s+#\d+\n(.*)(\n\n+#\d+\n(.*))+(クリティカル|決定的成功|イクストリーム成功|ハード成功|成功|失敗|ファンブル|部分的成功)/gi,
      skillMultiRollRegex:
        /(?:x|rep|repeat)\d+( |\u3000)(S?(?:CC(?!B)|CBR(?!B)))[-+0-9()]*(?:&lt;=|<=)(\d+[crhe]*) 【(.*)】\s+#\d+\n/i,
    }),
    parseToken: parseCoc7DiceToken,
  },
  growth: coc7Growth,
}

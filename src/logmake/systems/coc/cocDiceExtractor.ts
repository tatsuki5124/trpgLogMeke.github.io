import {
  canonicalizeTargetName,
  classifyCocHighlight,
  cleanSkillTail,
  createDiceEventTarget,
} from '@/logmake/systems/coc/shared'
import type { DiceEvent, DiceEventTarget } from '@/logmake/types'

/**
 * createCocDiceExtractor の設定オプション。
 * CoC6版・CoC7版でコマンドプレフィックスなどが異なる。
 */
export interface CocDiceExtractorConfig {
  commandPrefix: string
  optionRegex: RegExp
  combineCommandPattern: RegExp
  skillAliases: Record<string, string>
}

/** parseDiceResult の内部解析結果 */
interface ParsedCocDiceResult {
  kind: 'systemCommand' | 'genericD100'
  command: string
  outcomeText: string
  partOutcomes: string[]
  roll: number
  tail: string
}

const SKILL_SEPARATOR_REGEX = /[,，、]/
const BRACKET_ONLY_SKILL_REGEX = /^【([^】]+)】$/
/** SAN・能力値ロールなど、成長判定表示で切り分けたい特殊ステータス名 */
const STATUS_TARGET_NAMES = new Set([
  'SAN',
  'SAN値チェック',
  '正気度',
  '正気度ロール',
  'STR',
  'CON',
  'POW',
  'DEX',
  'APP',
  'SIZ',
  'INT',
  'EDU',
  'アイデア',
  '幸運',
  'ショックロール',
  '知識',
])
const ABILITY_TARGET_NAMES = ['STR', 'CON', 'POW', 'DEX', 'APP', 'SIZ', 'INT', 'EDU'] as const
const ABILITY_TARGET_PATTERN = ABILITY_TARGET_NAMES.join('|')
const ABILITY_FACTOR_PATTERN = `(?:${ABILITY_TARGET_PATTERN})(?:[*×]\\d+)?`
const ABILITY_EXPRESSION_REGEX = new RegExp(
  `^(?:${ABILITY_FACTOR_PATTERN})(?:\\+(?:${ABILITY_FACTOR_PATTERN}))*$`
)

/**
 * CoC 汎用のダイスイベント抽出関数を生成するファクトリ。
 * d100 ロール形式とコマンド形式の両パターンに対応し、
 * 複合コマンドや複数技能を持つロールも解析する。
 *
 * @param config - コマンドプレフィックス・オプション正規表現などの設定
 * @returns ログフラグメント文字列を受け取り DiceEvent を返す抽出関数
 */
export function createCocDiceExtractor(
  config: CocDiceExtractorConfig
): (fragment: string) => DiceEvent | undefined {
  const d100ResultRegex = createD100ResultRegex(config.commandPrefix)
  const genericD100ResultRegex = createGenericD100ResultRegex()
  const commandResultRegex = createCommandResultRegex(config.commandPrefix)

  return function parseCocDiceToken(fragment: string): DiceEvent | undefined {
    const result = parseDiceResult(
      fragment,
      d100ResultRegex,
      genericD100ResultRegex,
      commandResultRegex
    )
    if (!result) {
      return undefined
    }

    const cocOption = fragment.match(config.optionRegex)?.[1] ?? ''
    const targets = parseDiceTargets(
      result.command,
      result.tail,
      result.partOutcomes,
      config
    )

    return {
      rawText: fragment,
      command: result.command,
      outcomeText: result.outcomeText,
      primaryRoll: result.roll,
      rolls: [result.roll],
      targets,
      status: targets.some((target) => isStatusTargetName(target.name)),
      highlight: classifyCocHighlight(result.outcomeText),
      meta: cocOption ? { cocOption } : undefined,
    }
  }
}

/**
 * フラグメント文字列から d100 形式またはコマンド形式のダイス結果を解析する。
 *
 * @param fragment - 解析対象のログフラグメント
 * @param d100ResultRegex - d100 ロール形式の正規表現
 * @param genericD100ResultRegex - 汎用 1d100 ロール形式の正規表現
 * @param commandResultRegex - コマンド形式の正規表現
 * @returns 解析結果、またはいずれにも一致しない場合は undefined
 */
function parseDiceResult(
  fragment: string,
  d100ResultRegex: RegExp,
  genericD100ResultRegex: RegExp,
  commandResultRegex: RegExp
): ParsedCocDiceResult | undefined {
  const d100Match = fragment.match(d100ResultRegex)
  if (d100Match?.groups) {
    const { roll, outcome, command, tail } = d100Match.groups
    if (
      roll === undefined ||
      outcome === undefined ||
      command === undefined ||
      tail === undefined
    ) {
      return undefined
    }
    return {
      kind: 'systemCommand',
      roll: Number(roll),
      outcomeText: outcome,
      command,
      tail,
      partOutcomes: [],
    }
  }

  const genericD100Match = fragment.match(genericD100ResultRegex)
  if (genericD100Match?.groups) {
    const { roll, outcome, command, tail } = genericD100Match.groups
    if (
      roll === undefined ||
      outcome === undefined ||
      command === undefined ||
      tail === undefined
    ) {
      return undefined
    }
    return {
      kind: 'genericD100',
      roll: Number(roll),
      outcomeText: outcome,
      command,
      tail,
      partOutcomes: [],
    }
  }

  const commandMatch = fragment.match(commandResultRegex)
  if (commandMatch?.groups) {
    const { roll, outcome, command, tail } = commandMatch.groups
    if (
      roll === undefined ||
      outcome === undefined ||
      command === undefined ||
      tail === undefined
    ) {
      return undefined
    }
    return {
      kind: 'systemCommand',
      roll: Number(roll),
      outcomeText: outcome,
      command,
      tail,
      partOutcomes: parsePartOutcomes(commandMatch.groups.parts),
    }
  }

  return undefined
}

/**
 * コマンド・テール・パートアウトカムから DiceEventTarget の配列を構築する。
 * ブラケット形式・複合コマンド・単一技能など複数の記法に対応する。
 *
 * @param command - ダイスコマンド文字列
 * @param rawTail - 技能名部分の生テキスト
 * @param partOutcomes - 複合コマンド時の各部分アウトカム配列
 * @param config - 技能エイリアスや複合コマンドパターン
 * @returns 判定対象の配列
 */
function parseDiceTargets(
  command: string,
  rawTail: string,
  partOutcomes: string[],
  config: CocDiceExtractorConfig
): DiceEventTarget[] {
  const tail = cleanSkillTail(rawTail)
  if (!tail) {
    return []
  }

  const commandTargets = parseCommandTargets(
    command,
    config.combineCommandPattern
  )
  const bracketOnlyMatch = tail.match(BRACKET_ONLY_SKILL_REGEX)

  if (bracketOnlyMatch) {
    const name = canonicalizeTargetName(
      bracketOnlyMatch[1],
      config.skillAliases
    )
    return [createDiceEventTarget(name, commandTargets[0])]
  }

  if (commandTargets.length > 1) {
    const parts = tail
      .split(SKILL_SEPARATOR_REGEX)
      .map((part) => normalizeSkillPart(part, config.skillAliases))
      .filter(Boolean)

    if (parts.length === commandTargets.length) {
      return parts.map((name, index) =>
        createDiceEventTarget(name, commandTargets[index], partOutcomes[index])
      )
    }

    return [{ name: tail, judge: null }]
  }

  if (/^【[^】]+】/.test(tail)) {
    return [{ name: tail, judge: null }]
  }

  return [
    createDiceEventTarget(
      canonicalizeTargetName(tail, config.skillAliases),
      commandTargets[0]
    ),
  ]
}

/**
 * コマンド文字列から目標値（数値）の配列を取得する。
 * CBR コンバインコマンドの場合は 2 つの値を返す。
 *
 * @param command - 解析対象のコマンド文字列
 * @param combinePattern - コンバインコマンドを検出する正規表現
 * @returns 目標値の配列（目標値なしの場合は空配列）
 */
function parseCommandTargets(
  command: string,
  combinePattern: RegExp
): number[] {
  const combineMatch = command.match(combinePattern)
  if (combineMatch) {
    return [Number(combineMatch[1]), Number(combineMatch[2])]
  }

  const targetMatch = command.match(/&lt;=(\d+)/i)
  if (targetMatch) {
    return [Number(targetMatch[1])]
  }

  const rawTargetMatch = command.match(/<=(\d+)/i)
  return rawTargetMatch ? [Number(rawTargetMatch[1])] : []
}

/**
 * 技能名の1パーツをトリム・ブラケット除去・エイリアス変換して正規化する。
 *
 * @param part - 区切り文字で分割した技能名パーツ
 * @param aliases - 技能エイリアスマップ
 * @returns 正規化後の技能名
 */
function normalizeSkillPart(
  part: string,
  aliases: Record<string, string>
): string {
  const trimmed = part.trim()
  const bracketOnlyMatch = trimmed.match(BRACKET_ONLY_SKILL_REGEX)
  return canonicalizeTargetName(bracketOnlyMatch?.[1] ?? trimmed, aliases)
}

function isStatusTargetName(targetName: string): boolean {
  const normalized = targetName.replace(/\s+/g, '').toUpperCase()
  return STATUS_TARGET_NAMES.has(normalized) || ABILITY_EXPRESSION_REGEX.test(normalized)
}

/**
 * d100 ロール形式（CCB<=N ... (1D100<=N) > ロール値 > アウトカム）を検出する正規表現を生成する。
 *
 * @param commandPrefix - CoC コマンドのプレフィックスパターン（例: 'CCB|CC'）
 * @returns 正規表現
 */
function createD100ResultRegex(commandPrefix: string): RegExp {
  return new RegExp(
    [
      '^\\s*',
      `(?<command>${commandPrefix}[^\\s＞]*)`,
      '\\s*(?<tail>.*?)\\s*',
      '\\(1D100(?:&lt;=|<=)\\d+\\)',
      '(?: ボーナス・ペナルティダイス\\[-?\\d+\\] ＞ [\\d,\\s]+)?',
      ' ＞ (?<roll>\\d+) ＞ (?<outcome>.*)$',
    ].join(''),
    'i'
  )
}

/**
 * 汎用 1d100 形式（1d100<=N ... (1D100<=N) > ロール値 > アウトカム）を検出する正規表現を生成する。
 *
 * @returns 正規表現
 */
function createGenericD100ResultRegex(): RegExp {
  return new RegExp(
    [
      '^\\s*',
      '(?<command>1d100(?:&lt;=|<=)\\d+[^\\s＞]*)',
      '\\s*(?<tail>.*?)\\s*',
      '\\(1D100(?:&lt;=|<=)\\d+\\)',
      '(?: ボーナス・ペナルティダイス\\[-?\\d+\\] ＞ [\\d,\\s]+)?',
      ' ＞ (?<roll>\\d+) ＞ (?<outcome>.*)$',
    ].join(''),
    'i'
  )
}

/**
 * コマンド形式（CC<=N > ロール値 [parts] > アウトカム）を検出する正規表現を生成する。
 *
 * @param commandPrefix - CoC コマンドのプレフィックスパターン
 * @returns 正規表現
 */
function createCommandResultRegex(commandPrefix: string): RegExp {
  return new RegExp(
    [
      '^\\s*',
      `(?<command>${commandPrefix}[^\\s＞]*)`,
      '\\s*(?<tail>.*?)\\s*',
      '＞\\s*(?<roll>\\d+)',
      '(?:\\[(?<parts>[^\\]]+)\\])?',
      '\\s*＞\\s*(?<outcome>.*)$',
    ].join(''),
    'i'
  )
}

/**
 * コンバインコマンドの `[parts]` 部分から各パートのアウトカムを抽出する。
 *
 * @param rawParts - '[成功, 失敗]' の内側テキスト、または undefined
 * @returns アウトカム文字列の配列
 */
function parsePartOutcomes(rawParts: string | undefined): string[] {
  return rawParts
    ? rawParts
        .split(SKILL_SEPARATOR_REGEX)
        .map((part) => part.trim())
        .filter(Boolean)
    : []
}

import {
  canonicalizeTargetName,
  classifyCocHighlight,
  cleanSkillTail,
  createJudgmentTarget,
} from '@/logmake/systems/coc/shared'
import type { DiceTokenResult, JudgmentTarget } from '@/logmake/types'

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
  resultText: string
  partResults: string[]
  roll: number
  tail: string
}

const SKILL_SEPARATOR_REGEX = /[,，、]/
const BRACKET_ONLY_SKILL_REGEX = /^【([^】]+)】$/

/**
 * CoC 汎用のダイスイベント抽出関数を生成するファクトリ。
 * d100 ロール形式とコマンド形式の両パターンに対応し、
 * 複合コマンドや複数技能を持つロールも解析する。
 *
 * @param config - コマンドプレフィックス・オプション正規表現などの設定
 * @returns ログフラグメント文字列を受け取り DiceTokenResult を返す抽出関数
 */
export function createCocDiceExtractor(
  config: CocDiceExtractorConfig
): (fragment: string) => DiceTokenResult | undefined {
  const d100ResultRegex = createD100ResultRegex(config.commandPrefix)
  const genericD100ResultRegex = createGenericD100ResultRegex()
  const commandResultRegex = createCommandResultRegex(config.commandPrefix)

  return function parseCocDiceToken(fragment: string): DiceTokenResult | undefined {
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
      result.partResults,
      config
    )

    return {
      dice: {
        rawText: fragment,
        command: result.command,
        resultText: result.resultText,
        primaryRoll: result.roll,
        targets,
        meta: cocOption ? { cocOption } : undefined,
      },
      highlight: classifyCocHighlight(result.resultText),
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
      resultText: outcome,
      command,
      tail,
      partResults: [],
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
      resultText: outcome,
      command,
      tail,
      partResults: [],
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
      resultText: outcome,
      command,
      tail,
      partResults: parsePartResults(commandMatch.groups.parts),
    }
  }

  return undefined
}

/**
 * コマンド・テール・パートリザルトから JudgmentTarget の配列を構築する。
 * ブラケット形式・複合コマンド・単一技能など複数の記法に対応する。
 *
 * @param command - ダイスコマンド文字列
 * @param rawTail - 技能名部分の生テキスト
 * @param partResults - 複合コマンド時の各部分結果テキスト配列
 * @param config - 技能エイリアスや複合コマンドパターン
 * @returns 判定対象の配列
 */
function parseDiceTargets(
  command: string,
  rawTail: string,
  partResults: string[],
  config: CocDiceExtractorConfig
): JudgmentTarget[] {
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
    return [createJudgmentTarget(name, commandTargets[0])]
  }

  if (commandTargets.length > 1) {
    const parts = tail
      .split(SKILL_SEPARATOR_REGEX)
      .map((part) => normalizeSkillPart(part, config.skillAliases))
      .filter(Boolean)

    if (parts.length === commandTargets.length) {
      return parts.map((name, index) =>
        createJudgmentTarget(name, commandTargets[index], partResults[index])
      )
    }

    return [{ name: tail }]
  }

  if (/^【[^】]+】/.test(tail)) {
    return [{ name: tail }]
  }

  return [
    createJudgmentTarget(
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
 * コンバインコマンドの `[parts]` 部分から各パートの結果テキストを抽出する。
 *
 * @param rawParts - '[成功, 失敗]' の内側テキスト、または undefined
 * @returns 結果テキスト文字列の配列
 */
function parsePartResults(rawParts: string | undefined): string[] {
  return rawParts
    ? rawParts
        .split(SKILL_SEPARATOR_REGEX)
        .map((part) => part.trim())
        .filter(Boolean)
    : []
}

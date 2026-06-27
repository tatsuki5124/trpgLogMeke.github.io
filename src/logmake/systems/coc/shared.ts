import type { DefaultSkillValueMap } from '@/logmake/lib/defaultSkillValues'
import type { JudgmentTarget, ResultHighlight } from '@/logmake/types'

const TAG_REGEX = /<[^>]+>/g

/** CoC の成長判定アウトカムを検出する正規表現 */
export const COC_GROWTH_OUTCOME_REGEX =
  /クリティカル|決定的成功|スペシャル|イクストリーム成功|ハード成功|成功|失敗|ファンブル|致命的失敗|故障/

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
 * 技能名テールから HTML タグと余分な空白を除去する。
 *
 * @param tail - クリーンアップ前の技能名テキスト（HTML タグを含む場合がある）
 * @returns タグ除去・空白正規化後の技能名
 */
export function cleanSkillTail(tail: string): string {
  return tail.replace(TAG_REGEX, '').replace(/\s+/g, ' ').trim()
}

/**
 * JudgmentTarget オブジェクトを生成する。
 *
 * @param name - 技能名
 * @param target - 目標値（目標値なしの場合は undefined）
 * @param partResultText - この目標に対する個別結果テキスト
 * @returns 生成した JudgmentTarget
 */
export function createJudgmentTarget(
  name: string,
  target: number | undefined,
  partResultText?: string,
): JudgmentTarget {
  return {
    name,
    ...(partResultText ? { partResultText } : {}),
    ...(target === undefined ? {} : { target }),
  }
}

/**
 * アウトカムテキストから CoC の結果ハイライト種別を判定する。
 *
 * @param resultText - 判定する結果テキスト
 * @returns 成功なら 'success'、失敗なら 'failure'、それ以外は undefined
 */
export function classifyCocHighlight(
  resultText: string,
): ResultHighlight | undefined {
  if (
    /クリティカル|決定的成功|スペシャル|イクストリーム成功|ハード成功|成功/.test(
      resultText,
    )
  ) {
    return 'success'
  }

  if (/失敗|ファンブル|致命的失敗/.test(resultText)) {
    return 'failure'
  }

  return undefined
}

/**
 * 判定対象名がステータス（能力値・SAN 等）かどうかを判定する。
 *
 * @param targetName - 判定対象の名前
 * @returns ステータスなら true
 */
export function isStatusTargetName(targetName: string): boolean {
  const normalized = targetName.replace(/\s+/g, '').toUpperCase()
  return STATUS_TARGET_NAMES.has(normalized) || ABILITY_EXPRESSION_REGEX.test(normalized)
}

/**
 * 判定対象の目標値がデフォルト技能値と一致するか（＝初期値成功）を判定する。
 *
 * @param target - 判定対象の JudgmentTarget
 * @param defaultSkillValues - 技能初期値マップ
 * @returns 初期値成功なら true
 */
export function isInitialSkillSuccess(
  target: JudgmentTarget,
  defaultSkillValues: DefaultSkillValueMap,
): boolean {
  return (
    target.target !== undefined &&
    defaultSkillValues[target.name] === target.target
  )
}

/**
 * ダイスイベントのメタ情報から CoC オプション文字列を取得する。
 *
 * @param meta - DiceEvent.meta（undefined の場合は空文字を返す）
 * @returns CoC オプション文字列（例: 'c', 'b2'）、なければ空文字
 */
export function readCocOption(meta: Record<string, unknown> | undefined): string {
  return typeof meta?.cocOption === 'string' ? meta.cocOption : ''
}

/**
 * 技能名をエイリアスマップで正規名に変換する。
 * エイリアスが存在しない場合はトリム後の名前をそのまま返す。
 * エイリアスキーは空白除去・小文字化で比較する。
 *
 * @param name - 変換前の技能名
 * @param aliases - エイリアスキーと正規名のマップ
 * @returns 正規化後の技能名
 */
export function canonicalizeTargetName(
  name: string,
  aliases: Record<string, string>,
): string {
  const trimmed = name.trim()
  const aliasKey = trimmed.replace(/\s+/g, '').toLowerCase()
  return aliases[aliasKey] ?? trimmed
}

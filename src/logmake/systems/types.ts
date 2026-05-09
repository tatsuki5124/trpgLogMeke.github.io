import type { DefaultSkillValueMap } from '@/logmake/lib/defaultSkillValues'
import type {
  CharacterStyle,
  DiceEvent,
  DiceEventTarget,
  GameSystem,
  GrowthLabel,
} from '@/logmake/types'

/** GrowthCapability.classifyRecord に渡す判定オプション */
export interface ClassifyGrowthOptions {
  defaultSkillValues: DefaultSkillValueMap
  dice: DiceEvent
  target: DiceEventTarget
}

/**
 * システム固有の成長判定機能を定義するインターフェース。
 * ラベルの種類・デフォルト技能値の読み込み・ラベル分類・対象判定を提供する。
 */
export interface GrowthCapability {
  labels: GrowthLabel[]
  loadDefaultSkillValues(): Promise<DefaultSkillValueMap>
  classifyRecord(options: ClassifyGrowthOptions): GrowthLabel
  isGrowthTarget(dice: DiceEvent): boolean
}

/** ログ内の話者名をシステム固有ルールで正規化した結果 */
export interface NormalizedSpeaker {
  /** 内部集計・設定で使用する名前 */
  name: string
  /** 出力 HTML で表示する名前。null の場合は話者名を表示しない */
  displayName: string | null
  /** ログ読込時に使う表示スタイルの初期値 */
  defaultStyle?: CharacterStyle
}

/**
 * ゲームシステムの解析・成長判定機能を束ねるインターフェース。
 * 各システムはこれを実装した定数として systems/ に定義される。
 */
export interface LogmakeSystem {
  id: GameSystem
  name: string
  log: {
    normalizeSource(content: string): string
    normalizeSpeaker?(speakerName: string): NormalizedSpeaker
    parseToken(fragment: string): DiceEvent | undefined
  }
  growth?: GrowthCapability
}

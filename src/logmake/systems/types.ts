import type { DefaultSkillValueMap } from '@/logmake/lib/defaultSkillValues'
import type {
  DiceEvent,
  DiceRollRecord,
  GameSystem,
  GrowthLabel,
  GrowthTargetKind,
} from '@/logmake/types'

/** GrowthCapability.classifyEvent に渡す判定オプション */
export interface ClassifyGrowthEventOptions {
  defaultSkillValues: DefaultSkillValueMap
  roll: DiceRollRecord
}

/** システム固有の成長判定分類結果 */
export interface GrowthClassification {
  label: GrowthLabel
  targetNames: string[]
  initialSuccessTargetNames: string[]
  status: boolean
  targetKind: GrowthTargetKind
}

/**
 * システム固有の成長判定機能を定義するインターフェース。
 * ラベルの種類・デフォルト技能値の読み込み・ロール単位の分類を提供する。
 */
export interface GrowthCapability {
  labels: GrowthLabel[]
  loadDefaultSkillValues(): Promise<DefaultSkillValueMap>
  classifyEvent(options: ClassifyGrowthEventOptions): GrowthClassification | null
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
    parseToken(fragment: string): DiceEvent | undefined
  }
  growth?: GrowthCapability
}

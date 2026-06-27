import {
  COC_GROWTH_OUTCOME_REGEX,
  isStatusTargetName,
  readCocOption,
} from '@/logmake/systems/coc/shared'
import type { GrowthCapability, GrowthClassification } from '@/logmake/systems/types'
import { normalizeDefaultSkillValues } from '@/logmake/lib/defaultSkillValues'
import type { DefaultSkillValueMap } from '@/logmake/lib/defaultSkillValues'
import type {
  DiceEvent,
  JudgmentTarget,
  GrowthLabel,
  GrowthTargetKind,
} from '@/logmake/types'

/**
 * createCocGrowth の設定オプション。
 * 細かい成功種別の分類ロジックはシステム版ごとに classifyRefinedSuccess で定義する。
 */
export interface CocGrowthConfig {
  labels: GrowthLabel[]
  rawDefaultSkillValues: unknown
  successRegex: RegExp
  classifyRefinedSuccess: (params: {
    outcome: string
    cocOption: string
    target?: JudgmentTarget
    defaultSkillValues: DefaultSkillValueMap
  }) => GrowthLabel
}

/**
 * CoC 汎用の成長判定機能を生成するファクトリ。
 * クリティカル・ファンブル・故障の判定は共通ロジックで行い、
 * それ以外の成功種別の分類は config.classifyRefinedSuccess に委譲する。
 *
 * @param config - ラベル定義・デフォルト技能値・成功分類ロジックの設定
 * @returns GrowthCapability の実装
 */
export function createCocGrowth(config: CocGrowthConfig): GrowthCapability {
  return {
    labels: config.labels,
    async loadDefaultSkillValues() {
      return normalizeDefaultSkillValues(config.rawDefaultSkillValues)
    },
    classifyEvent({ defaultSkillValues, dice }) {
      if (!COC_GROWTH_OUTCOME_REGEX.test(dice.resultText)) {
        return null
      }

      const outcome = dice.resultText
      const cocOption = readCocOption(dice.meta)
      const isCritical =
        /クリティカル|決定的成功/.test(outcome) || cocOption === 'c'
      const isFumble = /ファンブル|致命的失敗/.test(outcome)
      const isSuccess = config.successRegex.test(outcome) || isCritical
      const targetKind = classifyTargetKind(dice)
      const targetNames = readTargetNames(dice)
      const initialSuccessTargetNames = dice.targets
        .filter((target) =>
          isInitialSuccessTarget(dice, target, defaultSkillValues)
        )
        .map((target) => target.name)

      if (isCritical) {
        return createClassification({
          label: 'クリティカル',
          dice,
          targetKind,
          targetNames,
          initialSuccessTargetNames,
        })
      }

      if (isSuccess) {
        const refinedLabel = config.classifyRefinedSuccess({
          outcome,
          cocOption,
          target: dice.targets[0],
          defaultSkillValues,
        })
        if (refinedLabel !== '通常成功') {
          return createClassification({
            label: refinedLabel,
            dice,
            targetKind,
            targetNames,
            initialSuccessTargetNames,
          })
        }
      }

      if (isFumble) {
        return createClassification({
          label: 'ファンブル',
          dice,
          targetKind,
          targetNames,
          initialSuccessTargetNames,
        })
      }

      if (/故障/.test(outcome)) {
        return createClassification({
          label: '故障',
          dice,
          targetKind,
          targetNames,
          initialSuccessTargetNames,
        })
      }

      if (!isSuccess) {
        return createClassification({
          label: '通常失敗',
          dice,
          targetKind,
          targetNames,
          initialSuccessTargetNames,
        })
      }

      if (initialSuccessTargetNames.length > 0) {
        return createClassification({
          label: '初期値成功',
          dice,
          targetKind,
          targetNames,
          initialSuccessTargetNames,
        })
      }

      return createClassification({
        label: '通常成功',
        dice,
        targetKind,
        targetNames,
        initialSuccessTargetNames,
      })
    },
  }
}

function createClassification(params: {
  label: GrowthLabel
  dice: DiceEvent
  targetKind: GrowthTargetKind
  targetNames: string[]
  initialSuccessTargetNames: string[]
}): GrowthClassification {
  return {
    label: params.label,
    targetNames: params.targetNames,
    initialSuccessTargetNames: params.initialSuccessTargetNames,
    status: params.dice.targets.some((target) => isStatusTargetName(target.name)),
    targetKind: params.targetKind,
  }
}

function readTargetNames(dice: DiceEvent): string[] {
  if (dice.targets.length > 0) {
    return dice.targets.map((target) => target.name)
  }

  return [dice.command]
}

function classifyTargetKind(dice: DiceEvent): GrowthTargetKind {
  if (/^1d100/i.test(dice.command) && dice.targets.length === 0) {
    return 'rawD100'
  }
  if (/^S?RESB?\(/i.test(dice.command)) {
    return 'resistance'
  }
  if (/^S?CBRB?\(/i.test(dice.command) && dice.targets.length === 0) {
    return 'combination'
  }
  if (dice.targets.some((target) => target.target === undefined)) {
    return 'unlistedSkill'
  }
  return 'listedSkill'
}

function isInitialSuccessTarget(
  dice: DiceEvent,
  target: JudgmentTarget,
  defaultSkillValues: DefaultSkillValueMap,
): boolean {
  return (
    isTargetSuccess(dice, target) &&
    target.target !== undefined &&
    defaultSkillValues[target.name] === target.target
  )
}

function isTargetSuccess(dice: DiceEvent, target: JudgmentTarget): boolean {
  const outcome =
    target.partResultText ?? (dice.targets.length === 1 ? dice.resultText : '')
  return /クリティカル|決定的成功|スペシャル|イクストリーム成功|ハード成功|成功/.test(
    outcome,
  )
}

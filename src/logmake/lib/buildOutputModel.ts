import { isPrimaryTab } from '@/logmake/lib/defaults'
import type {
  BuildOutputOptions,
  OutputModel,
  OutputTabSection,
  ParsedLog,
} from '@/logmake/types'

/**
 * パース済みログと表示設定から HTML 出力用の中間データモデルを構築する。
 * 非表示タブのエントリは除外し、連続する同一タブ・同一キャラクターをまとめる。
 *
 * @param parsedLog - parseLogHtml の戻り値
 * @param options - タブ・キャラクターの表示設定
 * @returns HTML 出力用データモデル
 */
export function buildOutputModel(
  parsedLog: ParsedLog,
  options: BuildOutputOptions
): OutputModel {
  const sections: OutputTabSection[] = []
  const tabVisibilityClasses = createTabVisibilityClasses(options.tabs)
  const toggles = Object.values(options.tabs)
    .filter((tab) => !isPrimaryTab(tab.name) && tab.visible)
    .map((tab) => {
      const tabClass = tabVisibilityClasses[tab.name]
      return {
        name: tab.name,
        color: tab.color,
        inputId: `${tabClass}-toggle`,
        tabVisibilityClass: tabClass,
      }
    })

  for (const entry of parsedLog.entries) {
    const tab = options.tabs[entry.tabName]
    if (!tab?.visible) {
      continue
    }

    const character = options.characters[entry.charName] ?? {
      name: entry.charName,
      color: entry.charColor,
      style: 'item' as const,
    }

    let currentSection = sections[sections.length - 1]
    if (!currentSection || currentSection.tabName !== entry.tabName) {
      currentSection = {
        tabName: entry.tabName,
        tabColor: tab.color,
        tabVisibilityClass: tabVisibilityClasses[entry.tabName] ?? '',
        entries: [],
      }
      sections.push(currentSection)
    }

    let currentSpeaker =
      currentSection.entries[currentSection.entries.length - 1]
    if (!currentSpeaker || currentSpeaker.charName !== entry.charName) {
      currentSpeaker = {
        charName: entry.charName,
        color: character.color,
        style: character.style,
        paragraphs: [],
      }
      currentSection.entries.push(currentSpeaker)
    }

    currentSpeaker.paragraphs.push(...entry.paragraphs)
  }

  return { sections, toggles }
}

function createTabVisibilityClasses(
  tabs: Record<string, { name: string }>
): Record<string, string> {
  let index = 0
  const classes: Record<string, string> = {}

  for (const tab of Object.values(tabs)) {
    if (isPrimaryTab(tab.name)) {
      continue
    }

    classes[tab.name] = `logmake-tab-${index}`
    index += 1
  }

  return classes
}

import {
  createBaseTabs,
  createTabConfig,
  getTabDisplayName,
} from '@/logmake/lib/defaults'
import type { LogmakeSystem } from '@/logmake/systems'
import type {
  CharacterConfig,
  ContentParagraph,
  ContentToken,
  ParsedLog,
} from '@/logmake/types'

const BR_TAG_REGEX = /<br\s*\/?>/i
const COLOR_STYLE_REGEX = /(?:^|;)\s*color\s*:\s*(#[0-9a-fA-F]{6})\s*(?:;|$)/

interface RawLogEntry {
  color: string
  rawTabName: string
  rawSpeakerName: string
  rawContent: string
}

/**
 * CCFOLIA が出力した HTML ログを解析し、構造化されたデータに変換する。
 * タブ・キャラクター・発言内容を抽出し、ダイスイベントもパースする。
 *
 * @param rawHtml - CCFOLIA から出力された HTML 文字列
 * @param system - 使用するゲームシステム（ダイス解析・ソース正規化に使用）
 * @returns パース済みログデータ（解析失敗時は warnings に理由が入る）
 */
export function parseLogHtml(rawHtml: string, system: LogmakeSystem): ParsedLog {
  const tabs = createBaseTabs()
  const warnings: string[] = []
  const entries = []
  const characterOrder: string[] = []
  const characterSeenCount: Record<string, number> = {}
  const characterColors: Record<string, string> = {}
  const characterDefaultStyles: Partial<
    Record<string, CharacterConfig['style']>
  > = {}

  for (const [index, entry] of readRawEntries(rawHtml).entries()) {
    const { color, rawTabName, rawSpeakerName, rawContent } = entry
    const speaker = normalizeSpeaker(rawSpeakerName, system)
    const charName = speaker.name
    const tabName = getTabDisplayName(rawTabName.trim())
    const normalizedContent = system.log.normalizeSource(rawContent)

    if (!tabs[tabName]) {
      tabs[tabName] = createTabConfig(tabName)
    }

    if (!characterSeenCount[charName]) {
      characterOrder.push(charName)
      characterSeenCount[charName] = 0
    }

    characterSeenCount[charName] += 1
    characterColors[charName] = color
    if (speaker.defaultStyle) {
      characterDefaultStyles[charName] = speaker.defaultStyle
    }

    entries.push({
      id: `${tabName}-${charName}-${index}`,
      tabName,
      charName,
      displayName: speaker.displayName,
      charColor: color,
      sourceHtml: normalizedContent,
      paragraphs: parseParagraphs(normalizedContent, system),
    })
  }

  if (entries.length === 0) {
    warnings.push(
      'ログ形式を解析できませんでした。CCFOLIA出力HTMLか、対象範囲の形式を確認してください。',
    )
  }

  const characters = characterOrder.reduce<Record<string, CharacterConfig>>(
    (result, charName) => {
      result[charName] = {
        name: charName,
        color: characterColors[charName],
        // 2回以上登場するキャラクターを PC（character）として扱う
        style:
          characterDefaultStyles[charName] ??
          (characterSeenCount[charName] > 1 ? 'character' : 'item'),
      }
      return result
    },
    {},
  )

  return {
    entries,
    tabs,
    characters,
    warnings,
  }
}

/**
 * HTML 文字列を DOMParser で解析し、発言エントリの生データ配列を返す。
 *
 * @param rawHtml - CCFOLIA から出力された HTML 文字列
 * @returns 解析済み生エントリの配列（無効な段落は除外済み）
 */
function readRawEntries(rawHtml: string): RawLogEntry[] {
  const document = new DOMParser().parseFromString(rawHtml, 'text/html')
  const paragraphs = Array.from(document.querySelectorAll('p'))

  return paragraphs
    .map(readRawEntry)
    .filter((entry): entry is RawLogEntry => entry !== null)
}

/**
 * `<p>` 要素からタブ名・キャラクター名・発言内容を抽出する。
 * CCFOLIA 形式（color付き p、3つ以上の span）でない場合は null を返す。
 *
 * @param paragraph - 解析対象の段落要素
 * @returns 抽出した生エントリ、または解析不能な場合は null
 */
function readRawEntry(paragraph: HTMLParagraphElement): RawLogEntry | null {
  const color = readSpeakerColor(paragraph)
  const spans = Array.from(paragraph.children).filter(isSpanElement)

  if (!color || spans.length < 3) {
    return null
  }

  const rawTabName = readTabName(spans[0].textContent ?? '')
  const rawSpeakerName = spans[1].textContent ?? ''
  const rawContent = spans[2].innerHTML.trim()

  if (!rawTabName || !rawContent) {
    return null
  }

  return {
    color,
    rawTabName,
    rawSpeakerName,
    rawContent,
  }
}

/**
 * Element が HTMLSpanElement かを判定する型ガード。
 *
 * @param element - 判定対象の要素
 * @returns span 要素なら true
 */
function isSpanElement(element: Element): element is HTMLSpanElement {
  return element.tagName.toLowerCase() === 'span'
}

/**
 * `<p>` 要素の style 属性から #RRGGBB 形式のカラーコードを取得する。
 *
 * @param paragraph - 解析対象の段落要素
 * @returns カラーコード文字列、または style がない・形式不一致の場合は null
 */
function readSpeakerColor(paragraph: HTMLParagraphElement): string | null {
  return paragraph.getAttribute('style')?.match(COLOR_STYLE_REGEX)?.[1] ?? null
}

/**
 * タブラベル文字列から [...] ブラケットを除いたタブ識別子を取得する。
 *
 * @param tabLabel - 生のタブラベルテキスト（例: '[main]'）
 * @returns ブラケット除去後のタブ識別子（例: 'main'）
 */
function readTabName(tabLabel: string): string {
  const trimmed = tabLabel.trim()
  return (trimmed.match(/^\[(.*)\]$/s)?.[1] ?? trimmed).trim()
}

function normalizeSpeaker(
  speakerName: string,
  system: LogmakeSystem,
): {
  name: string
  displayName: string | null
  defaultStyle?: CharacterConfig['style']
} {
  const normalized = system.log.normalizeSpeaker?.(speakerName)
  if (normalized) {
    return normalized
  }
  const name = speakerName.trim()
  return {
    name,
    displayName: name,
  }
}

/**
 * 正規化済みの HTML コンテンツ文字列を ContentParagraph の配列に変換する。
 * br タグを段落区切りとして扱い、各フラグメントをシステムのパーサに渡す。
 *
 * @param content - 正規化済みの発言内容 HTML
 * @param system - ダイスイベント抽出に使用するゲームシステム
 * @returns 段落配列
 */
function parseParagraphs(
  content: string,
  system: LogmakeSystem,
): ContentParagraph[] {
  const paragraphs: ContentParagraph[] = []
  let currentTokens: ContentToken[] = []

  for (const fragment of content.split(BR_TAG_REGEX)) {
    if (fragment.trim() === '') {
      if (currentTokens.length > 0) {
        paragraphs.push({ tokens: currentTokens })
      }
      currentTokens = []
      continue
    }

    const dice = system.log.parseToken(fragment)
    currentTokens.push({
      content: fragment,
      ...(dice ? { dice, highlight: dice.highlight } : {}),
    })
  }

  if (currentTokens.length > 0) {
    paragraphs.push({ tokens: currentTokens })
  }

  return paragraphs
}

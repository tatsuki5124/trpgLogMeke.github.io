import {
  DARK_BACK_COLOR,
  LIGHT_BACK_COLOR,
  computeHighlights,
  isPrimaryTab,
} from '@/logmake/lib/defaults'
import { buildOutputModel } from '@/logmake/lib/buildOutputModel'
import { escapeText, sanitizeCssColor } from '@/logmake/lib/htmlUtils'
import type {
  CharacterStyle,
  ContentParagraph,
  ContentToken,
  LogmakeSettings,
  OutputModel,
  OutputTabSection,
  OutputEntry,
  ParsedLog,
} from '@/logmake/types'

const COMPARISON_STYLE_OVERRIDES: Record<string, CharacterStyle> = {
  KP: 'scene',
  GM: 'scene',
  話者なし: 'scene',
  淡色の探索者: 'character',
  鮮烈な探索者: 'character',
  '場面：地下室前': 'scene',
}

const NAMELESS_NARRATION_NAMES = new Set(['KP', 'GM', '話者なし'])

type StructuredComparisonVariantOptions = {
  speakerNameMarker?: 'after-line' | 'underline'
  speakerBodyColor?: 'base' | 'speaker'
  speakerBodyGuide?: boolean
  namelessSceneMode?: 'narration' | 'speaker'
}

/**
 * 比較fixtureの意図に合わせて、一部キャラクター種別だけを比較用に固定する。
 *
 * @param parsedLog - 比較fixtureのパース結果
 * @returns 見た目比較用の出力モデル
 */
export function buildVisualComparisonOutputModel(
  parsedLog: ParsedLog,
): OutputModel {
  const characters = { ...parsedLog.characters }

  for (const [name, style] of Object.entries(COMPARISON_STYLE_OVERRIDES)) {
    const character = characters[name]
    if (character) {
      characters[name] = { ...character, style }
    }
  }

  return applyStableComparisonTabClasses(
    buildOutputModel(parsedLog, {
      tabs: parsedLog.tabs,
      characters,
    }),
  )
}

function applyStableComparisonTabClasses(outputModel: OutputModel): OutputModel {
  const classByTabName = new Map<string, string>()
  let index = 0

  for (const section of outputModel.sections) {
    if (!isPrimaryTab(section.tabName) && !classByTabName.has(section.tabName)) {
      classByTabName.set(section.tabName, `log-tab-${index}`)
      index += 1
    }
  }

  return {
    sections: outputModel.sections.map((section) => ({
      ...section,
      tabVisibilityClass: classByTabName.get(section.tabName) ?? '',
    })),
    toggles: outputModel.toggles.map((toggle) => {
      const tabVisibilityClass =
        classByTabName.get(toggle.name) ?? toggle.tabVisibilityClass
      return {
        ...toggle,
        inputId: `${tabVisibilityClass}-toggle`,
        tabVisibilityClass,
      }
    }),
  }
}

/**
 * 人物名の後ろに短いキャラクター色ラインを付ける比較用HTMLを生成する。
 *
 * @param outputModel - 比較対象の出力モデル
 * @param settings - 比較HTMLの表示設定
 * @returns 名前後ろライン案の比較用HTML
 */
export function buildSpeakerAfterLineComparisonHtml(
  outputModel: OutputModel,
  settings: LogmakeSettings,
): string {
  return buildStructuredComparisonVariantHtml(outputModel, settings, {
    speakerBodyColor: 'base',
    speakerNameMarker: 'after-line',
  })
}

/**
 * 人物本文に薄いキャラクター色ガイドを付ける比較用HTMLを生成する。
 *
 * @param outputModel - 比較対象の出力モデル
 * @param settings - 比較HTMLの表示設定
 * @returns 本文ガイド案の比較用HTML
 */
export function buildSpeakerBodyGuideComparisonHtml(
  outputModel: OutputModel,
  settings: LogmakeSettings,
): string {
  return buildStructuredComparisonVariantHtml(outputModel, settings, {
    speakerBodyColor: 'base',
    speakerBodyGuide: true,
  })
}

/**
 * 第一候補の要素をまとめた比較用HTMLを生成する。
 *
 * @param outputModel - 比較対象の出力モデル
 * @param settings - 比較HTMLの表示設定
 * @returns 統合候補案の比較用HTML
 */
export function buildCandidateCombinedComparisonHtml(
  outputModel: OutputModel,
  settings: LogmakeSettings,
): string {
  return buildStructuredComparisonVariantHtml(outputModel, settings, {
    speakerBodyColor: 'base',
    speakerNameMarker: 'underline',
  })
}

/**
 * 統合候補を土台に、名前下線を外して人物本文をキャラクター色にする比較用HTMLを生成する。
 *
 * @param outputModel - 比較対象の出力モデル
 * @param settings - 比較HTMLの表示設定
 * @returns 発言色付き統合候補案の比較用HTML
 */
export function buildCandidateColoredBodyComparisonHtml(
  outputModel: OutputModel,
  settings: LogmakeSettings,
): string {
  return buildStructuredComparisonVariantHtml(outputModel, settings, {
    speakerBodyColor: 'speaker',
    namelessSceneMode: 'speaker',
  })
}

function buildStructuredComparisonVariantHtml(
  outputModel: OutputModel,
  settings: LogmakeSettings,
  options: StructuredComparisonVariantOptions,
): string {
  return injectComparisonStyle(
    buildStructuredComparisonHtml(outputModel, settings, options),
    buildStructuredComparisonVariantStyle(options),
  )
}

function buildStructuredComparisonVariantStyle(
  options: StructuredComparisonVariantOptions,
): string {
  const styles: string[] = []

  if (options.speakerBodyColor === 'speaker') {
    styles.push(buildSpeakerBodyCharacterColorStyle())
  }
  if (options.speakerBodyGuide) {
    styles.push(buildSpeakerBodyGuideStyle())
  }
  if (options.speakerNameMarker === 'after-line') {
    styles.push(buildSpeakerNameAfterLineStyle())
  }
  if (options.speakerNameMarker === 'underline') {
    styles.push(buildSpeakerNameUnderlineStyle())
  }

  return styles.join('')
}

function buildStructuredComparisonHtml(
  outputModel: OutputModel,
  settings: LogmakeSettings,
  options: StructuredComparisonVariantOptions = {},
): string {
  const tabControls = outputModel.toggles
    .map(renderStructuredToggle)
    .join('\n')
  const content = outputModel.sections
    .map((section, index) =>
      renderStructuredSection(section, index, options, settings),
    )
    .join('\n')

  return `<!DOCTYPE html>
<html lang="ja">
    <head>
        <meta charset="UTF-8">
        <title>${escapeText(settings.logFileName)}</title>
        <script type="text/javascript">
            function toggleLogTab(obj, name) {
                const nodes = document.getElementsByClassName(name)
                for (let i = 0; i < nodes.length; i += 1) {
                    nodes[i].style.display = obj.checked ? 'block' : 'none'
                }
            }
        </script>
        <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, user-scalable=yes">
        <meta http-equiv="X-UA-Compatible" content="ie=edge" />
        ${buildStructuredStyle(settings, outputModel)}
    </head>
    <body>
        <div class="header">
            <h1>${escapeText(settings.title)}</h1>
            <details>
                <summary>タブ表示</summary>
                <div class="log-tab-controls">
                    ${tabControls}
                </div>
            </details>
        </div>
        <main class="log-frame">
            ${content}
        </main>
    </body>
</html>`
}

function renderStructuredToggle(tab: OutputModel['toggles'][number]): string {
  return `
                <label for="${tab.inputId}">
                    <input
                        class="${tab.tabVisibilityClass}-control"
                        type="checkbox"
                        id="${tab.inputId}"
                        checked="checked"
                        onchange="toggleLogTab(this, '${tab.tabVisibilityClass}')"
                    />
                    <span>${escapeText(tab.name)}</span>
                </label>`
}

function renderStructuredSection(
  section: OutputTabSection,
  index: number,
  options: StructuredComparisonVariantOptions,
  settings: LogmakeSettings,
): string {
  const sectionTitleId = `log-section-${index}-title`
  const isPrimary = isPrimaryTab(section.tabName)
  const className = isPrimary
    ? 'log-section log-section--primary'
    : `log-section log-section--tab ${section.tabVisibilityClass}`
  const ariaAttr = isPrimary
    ? ` aria-labelledby="${sectionTitleId}"`
    : ` aria-label="${escapeText(section.tabName)}"`
  const tabNameLabel = isPrimary
    ? ''
    : `    <span class="log-section-tab-name" aria-hidden="true">${escapeText(section.tabName)}</span>\n`
  const entries = section.entries
    .map((entry) => renderStructuredEntry(entry, options, settings))
    .join('\n')

  return `<section class="${className}"${ariaAttr}>
    <h2 id="${sectionTitleId}" class="log-section-title">${escapeText(section.tabName)}</h2>
${tabNameLabel}    ${entries}
</section>`
}

function renderStructuredEntry(
  entry: OutputEntry,
  options: StructuredComparisonVariantOptions,
  settings: LogmakeSettings,
): string {
  const speakerColor = sanitizeCssColor(entry.color)
  const messages = `<div class="log-messages">
    ${entry.paragraphs
      .map((paragraph) => renderStructuredParagraph(paragraph, settings))
      .join('\n')}
</div>`

  if (entry.style === 'character') {
    return `<div class="log-entry log-entry--speaker" style="--log-speaker-color: ${speakerColor};">
    <strong class="log-speaker">${escapeText(entry.charName)}</strong>
    ${messages}
</div>`
  }

  if (entry.style === 'scene') {
    if (NAMELESS_NARRATION_NAMES.has(entry.charName)) {
      if (options.namelessSceneMode === 'speaker') {
        return `<div class="log-entry log-entry--speaker" style="--log-speaker-color: ${speakerColor};">
    <strong class="log-speaker">${escapeText(entry.charName)}</strong>
    ${messages}
</div>`
      }

      return `<div class="log-entry log-entry--scene log-entry--narration log-entry--nameless-narration">
    ${messages}
</div>`
    }

    return `<div class="log-entry log-entry--scene" style="--log-speaker-color: ${speakerColor};">
    <h3 class="log-scene">${escapeText(entry.charName)}</h3>
    ${messages}
</div>`
  }

  return `<div class="log-entry log-entry--info">
    <p class="log-info-title"><strong>${escapeText(entry.charName)}</strong></p>
    ${messages}
</div>`
}

function renderStructuredParagraph(
  paragraph: ContentParagraph,
  settings: LogmakeSettings,
): string {
  return `<p class="log-message">
    ${paragraph.tokens
      .map((token) => renderStructuredToken(token, settings.darkMode))
      .join('<br>')}
</p>`
}

function renderStructuredToken(token: ContentToken, isDarkMode: boolean): string {
  const { success, failure } = computeHighlights(isDarkMode, false)
  if (token.highlight === 'success') {
    return `<span style="background: ${success};">${token.content}</span>`
  }
  if (token.highlight === 'failure') {
    return `<span style="background: ${failure};">${token.content}</span>`
  }
  return `<span>${token.content}</span>`
}

function buildStructuredStyle(
  settings: LogmakeSettings,
  outputModel: OutputModel,
): string {
  const frame = sanitizeCssColor(settings.frameColor)
  const name = sanitizeCssColor(settings.nameColor)
  const back = settings.darkMode ? DARK_BACK_COLOR : LIGHT_BACK_COLOR
  const textColor = settings.darkMode ? '#d0d0d0' : '#333333'
  const narrationColor = settings.darkMode ? '#b8b8b8' : '#555555'
  const infoColor = settings.darkMode ? '#a8a8a8' : '#707070'
  const tabBg = settings.darkMode
    ? 'rgba(200,200,200,0.06)'
    : 'rgba(127,127,127,0.1)'
  const tabColorRules = buildTabColorRules(outputModel)

  return `<style>
  @import url('https://fonts.googleapis.com/css?family=Noto+Sans+JP');
  @import url('https://fonts.googleapis.com/css2?family=New+Tegomin&family=Sawarabi+Mincho&display=swap');
  ${tabColorRules}
  html {
    font-size: 16px;
  }
  body {
    background-color: ${frame};
    color: ${textColor};
    font-family: 'Hiragino Sans', sans-serif;
    writing-mode: ${settings.writingMode === 'vertical' ? 'vertical-rl' : 'horizontal-tb'};
  }
  .header{
    background-color: ${frame};
    width:100%;
    position: fixed;
    z-index: 999;
    top:0;
    left:0;
  }
  details {
    background-color: ${frame};
    padding: .3rem;
    margin: 0;
  }
  summary {
    padding-left: 3rem;
    margin: 0;
    color: ${name};
  }
  h1 {
    padding: .3rem .3rem .3rem 3rem;
    margin: 0;
    color: ${name};
    font-family: 'New Tegomin', serif;
  }
  .log-tab-controls{
    padding-left: 3rem;
    color: ${name};
  }
  .log-tab-controls label{
    display: inline-block;
    margin-right: .75rem;
  }
  .log-tab-controls input {
    accent-color: var(--log-tab-color);
  }
  .log-frame {
    padding: 2rem;
    margin: 6rem 2rem 2rem;
    border: double 5px ${frame};
    background-color: ${back};
  }
  .log-message {
    margin: 0;
    padding: .5rem;
    text-align: left;
  }
  .log-message,
  .log-section-tab-name,
  .log-info-title,
  .log-speaker,
  .log-scene {
    word-break: normal;
    word-break: auto-phrase;
    overflow-wrap: break-word;
  }
  .log-section {
    position: relative;
  }
  .log-section--tab {
    position: relative;
    margin: 1.5rem 0;
    padding: 1.5rem .75rem 1rem;
    box-sizing: border-box;
    background: ${tabBg};
    border-inline-start: 3px solid var(--log-tab-color);
    overflow-wrap: break-word;
  }
  .log-section-tab-name {
    position: absolute;
    top: .35rem;
    right: .75rem;
    max-width: 40%;
    color: var(--log-tab-color);
    font-size: .75rem;
    font-weight: bold;
    line-height: 1.2;
    opacity: .45;
    pointer-events: none;
    text-align: right;
    writing-mode: horizontal-tb;
  }
  .log-section-title {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  /* logmake visual comparison: shared structured layout. */
  .log-entry--info {
    position: relative;
    margin: 1.75rem .75rem 1.5rem;
    padding: 1rem .75rem .5rem .75rem;
    border: solid 3px ${infoColor};
    border-radius: 8px;
    background: ${back};
    line-height: 1.5;
  }
  .log-info-title {
    position: absolute;
    display: inline-block;
    top: -0.6rem;
    left: .5rem;
    right: auto;
    margin: 0;
    padding: 0 .45rem;
    line-height: 1;
    background: ${back};
    color: ${infoColor};
    font-size: 1rem;
  }
  .log-entry--info .log-message {
    margin: 0;
    color: ${infoColor};
  }
  .log-section--tab .log-entry--info {
    margin: 1.1rem .75rem .95rem;
  }
  .log-speaker {
    display: block;
    color: var(--log-speaker-color);
    font-weight: bold;
  }
  .log-entry--speaker {
    margin: 1.7rem 1rem 1.7rem .5rem;
  }
  .log-entry--speaker .log-message {
    padding-block: .25rem;
    color: ${textColor};
  }
  .log-scene {
    margin: 2rem 0 .65rem .5rem;
    padding-block-start: 1.5rem;
    border-block-start: 1px solid color-mix(in srgb, var(--log-speaker-color) 25%, transparent);
    color: var(--log-speaker-color);
  }
  .log-entry--scene .log-message {
    color: ${narrationColor};
  }
  .log-entry--narration {
    margin: .65rem 1rem .65rem .5rem;
    color: ${narrationColor};
    opacity: 1;
  }
  .log-entry--narration .log-message {
    padding-block: .25rem;
    padding-inline: 0 .5rem;
    border-inline-start: 0;
    color: ${narrationColor};
  }
  @media screen and (max-width: 480px){
    html {
      font-size: 14px;
    }
    h1 {
      padding: .2rem .2rem .2rem 1.5rem;
      font-size: 27px;
    }
    .log-tab-controls{
      padding-left: 1.5rem;
    }
    details {
      padding: .2rem;
    }
    summary {
      padding-left: 1.5rem;
    }
    main {
      width: 100%;
    }
    .log-frame{
      padding: 0.8rem;
      margin: 5.5rem .6rem .6rem;
    }
  }
  ${
    settings.writingMode === 'vertical'
      ? `
  .header {
    writing-mode: horizontal-tb;
  }
  details[open] {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: 1rem;
  }
  details summary {
    flex-shrink: 0;
  }
  .log-info-title {
    top: -1rem;
    left: auto;
    right: -1rem;
  }`
      : ''
  }
  </style>`
}

function buildTabColorRules(outputModel: OutputModel): string {
  const colors = new Map<string, string>()
  for (const section of outputModel.sections) {
    if (section.tabVisibilityClass) {
      colors.set(section.tabVisibilityClass, sanitizeCssColor(section.tabColor))
    }
  }
  for (const toggle of outputModel.toggles) {
    colors.set(toggle.tabVisibilityClass, sanitizeCssColor(toggle.color))
  }

  return Array.from(colors.entries())
    .map(
      ([className, color]) =>
        `.${className} { --log-tab-color: ${color}; }\n  .${className}-control { --log-tab-color: ${color}; }`,
    )
    .join('\n  ')
}

function buildSpeakerNameAfterLineStyle(): string {
  return `
  /* logmake visual comparison: speaker name after-line marker. */
  .log-entry--speaker .log-speaker {
    display: inline-flex;
    align-items: center;
    gap: .45rem;
    max-width: 100%;
  }
  .log-entry--speaker .log-speaker::after {
    content: "";
    display: inline-block;
    flex: 0 0 clamp(2rem, 8vw, 4.5rem);
    border-block-start: 2px solid var(--log-speaker-color);
    opacity: .48;
    transform: translateY(.08em);
  }`
}

function buildSpeakerNameUnderlineStyle(): string {
  return `
  /* logmake visual comparison: speaker name underline marker. */
  .log-entry--speaker .log-speaker {
    display: inline-block;
    position: relative;
    padding-block-end: .12rem;
  }
  .log-entry--speaker .log-speaker::after {
    content: "";
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    border-block-end: 2px solid var(--log-speaker-color);
    opacity: .48;
  }`
}

function buildSpeakerBodyCharacterColorStyle(): string {
  return `
  /* logmake visual comparison: speaker body character color. */
  .log-entry--speaker .log-message {
    color: var(--log-speaker-color);
  }`
}

function buildSpeakerBodyGuideStyle(): string {
  return `
  /* logmake visual comparison: speaker body guide marker. */
  .log-entry--speaker .log-messages {
    position: relative;
  }
  .log-entry--speaker .log-messages::before {
    content: "";
    position: absolute;
    inset-block: .35rem;
    inset-inline-start: -.35rem;
    border-inline-start: 2px solid color-mix(in srgb, var(--log-speaker-color) 38%, transparent);
    pointer-events: none;
  }`
}

function injectComparisonStyle(html: string, comparisonStyle: string): string {
  return html.replace('</style>', `${comparisonStyle}\n  </style>`)
}

import {
  DARK_BACK_COLOR,
  LIGHT_BACK_COLOR,
  computeHighlights,
  isPrimaryTab,
} from '@/logmake/lib/defaults'
import { escapeText, sanitizeCssColor } from '@/logmake/lib/htmlUtils'
import type {
  ContentParagraph,
  ContentToken,
  LogmakeSettings,
  OutputModel,
  OutputTabSection,
  OutputEntry,
} from '@/logmake/types'

/**
 * 出力データモデルと整形設定から完全な HTML 文字列を生成する。
 * タブ表示切り替えスクリプトやスタイルシートも含む自己完結型の HTML を返す。
 *
 * @param outputModel - buildOutputModel の戻り値
 * @param settings - フォームで設定したログ整形設定
 * @returns 完全な HTML 文字列
 */
export function buildOutputHtml(
  outputModel: OutputModel,
  settings: LogmakeSettings
): string {
  const { success: successHL, failure: failureHL } = computeHighlights(
    settings.darkMode ?? false,
    settings.writingMode === 'vertical',
  )

  // token.content は CCFOLIA の innerHTML をそのまま通す（意図的・escapeText 不可）。
  // エスケープすると CCFOLIA のインライン書式（<b> 等）が壊れる。
  function renderToken(token: ContentToken): string {
    if (token.highlight === 'success') {
      return `<span style="background: ${successHL};">${token.content}</span>`
    }
    if (token.highlight === 'failure') {
      return `<span style="background: ${failureHL};">${token.content}</span>`
    }
    return `<span>${token.content}</span>`
  }

  function renderParagraph(paragraph: ContentParagraph): string {
    return `<p class="log-message">
    ${paragraph.tokens.map(renderToken).join('<br>')}
</p>`
  }

  function renderEntry(entry: OutputEntry): string {
    const speakerColor = sanitizeCssColor(entry.color)
    const paragraphs = entry.paragraphs.map(renderParagraph).join('\n')

    if (entry.style === 'character') {
      return `<div class="log-entry log-entry--speaker" style="--log-speaker-color: ${speakerColor};">
    <strong class="log-speaker">${escapeText(entry.charName)}</strong>
    ${paragraphs}
</div>`
    }

    if (entry.style === 'scene') {
      return `<div class="log-entry log-entry--scene" style="--log-speaker-color: ${speakerColor};">
    <h3 class="log-scene">${escapeText(entry.charName)}</h3>
    ${paragraphs}
</div>`
    }

    return `<div class="log-entry log-entry--info">
    <p class="log-info-title"><strong>${escapeText(entry.charName)}</strong></p>
    ${paragraphs}
</div>`
  }

  function renderSection(section: OutputTabSection, index: number): string {
    const sectionTitleId = `log-section-${index}-title`
    const isPrimary = isPrimaryTab(section.tabName)
    const className = isPrimary
      ? 'log-section log-section--primary'
      : `log-section log-section--tab ${section.tabVisibilityClass}`

    const style = isPrimary
      ? ''
      : ` style="--log-tab-color: ${sanitizeCssColor(section.tabColor)};"`

    const ariaAttr = isPrimary
      ? ` aria-labelledby="${sectionTitleId}"`
      : ` aria-label="${escapeText(section.tabName)}"`

    const tabNameLabel = isPrimary
      ? ''
      : `    <span class="log-section-tab-name" aria-hidden="true">${escapeText(section.tabName)}</span>\n`

    const entries = section.entries.map(renderEntry).join('\n')

    return `<section class="${className}"${style}${ariaAttr}>
    <h2 id="${sectionTitleId}" class="log-section-title">${escapeText(section.tabName)}</h2>
${tabNameLabel}    ${entries}
</section>`
  }

  const viewCheck = outputModel.toggles
    .map(
      (tab) => `
                <label for="${tab.inputId}">
                    <input
                        type="checkbox"
                        id="${tab.inputId}"
                        checked="checked"
                        onchange="toggleLogTab(this, '${tab.tabVisibilityClass}')"
                        style="accent-color: ${sanitizeCssColor(tab.color)};"
                    />
                    <span>${escapeText(tab.name)}</span>
                </label>`
    )
    .join('\n')

  const content = outputModel.sections
    .map((section, index) => renderSection(section, index))
    .join('\n')

  return `<!DOCTYPE html>
<html lang="ja">
    <head>
        <title>${escapeText(settings.logFileName)}</title>
        <meta charset="UTF-8">
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
        ${buildStyle(settings)}
    </head>
    <body>
        <div class="header">
            <h1>${escapeText(settings.title)}</h1>
            <details>
                <summary>タブ表示</summary>
                <div class="log-tab-controls">
                    ${viewCheck}
                </div>
            </details>
        </div>
        <main class="log-frame">
            ${content}
        </main>
    </body>
</html>`
}

/**
 * 設定値を埋め込んだ `<style>` タグ文字列を生成する。
 *
 * @param settings - フレーム色・背景色・文字色などの整形設定
 * @returns style タグを含む HTML 文字列
 */
function buildStyle(settings: LogmakeSettings): string {
  const frame = sanitizeCssColor(settings.frameColor)
  const name = sanitizeCssColor(settings.nameColor)
  const back = settings.darkMode ? DARK_BACK_COLOR : LIGHT_BACK_COLOR
  const textColor = settings.darkMode ? '#d0d0d0' : '#333333'
  const narrationColor = settings.darkMode ? '#b8b8b8' : '#555555'
  const infoColor = settings.darkMode ? '#a8a8a8' : '#707070'
  const tabBg = settings.darkMode ? 'rgba(200,200,200,0.06)' : 'rgba(127,127,127,0.1)'
  return `<style>
  @import url('https://fonts.googleapis.com/css?family=Noto+Sans+JP');
  @import url('https://fonts.googleapis.com/css2?family=New+Tegomin&family=Sawarabi+Mincho&display=swap');
  html {
    font-size: 16px;
  }
  body {
    background-color: ${frame};
    color: ${textColor};
    font-family: 'Hiragino Sans', sans-serif;
    writing-mode: ${settings.writingMode === 'vertical' ? 'vertical-rl' : 'horizontal-tb'};
  }
  .header {
    background-color: ${frame};
    width: 100%;
    position: fixed;
    z-index: 999;
    top: 0;
    left: 0;
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
  .log-tab-controls {
    padding-left: 3rem;
    color: ${name};
  }
  .log-tab-controls label {
    display: inline-block;
    margin-right: .75rem;
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
  }
  .log-entry--narration .log-message {
    padding-block: .25rem;
    padding-inline: 0 .5rem;
    color: ${narrationColor};
  }
  @media screen and (max-width: 480px) {
    html {
      font-size: 14px;
    }
    h1 {
      padding: .2rem .2rem .2rem 1.5rem;
      font-size: 27px;
    }
    .log-tab-controls {
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
    .log-frame {
      padding: 0.8rem;
      margin: 5.5rem .6rem .6rem;
    }
  }
  ${settings.writingMode === 'vertical' ? `
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
  }` : ''}
  </style>`
}

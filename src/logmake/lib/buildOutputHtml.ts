import {
  DARK_BACK_COLOR,
  FAILURE_HIGHLIGHT,
  LIGHT_BACK_COLOR,
  SUCCESS_HIGHLIGHT,
  isPrimaryTab,
} from '@/logmake/lib/defaults'
import {
  escapeText,
  sanitizeContentHtml,
  sanitizeCssColor,
} from '@/logmake/lib/htmlUtils'
import type {
  ContentParagraph,
  ContentToken,
  LogmakeSettings,
  OutputModel,
  OutputSection,
  OutputSpeakerEntry,
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
  const isVertical = settings.writingMode === 'vertical'
  const successHL = isVertical
    ? 'linear-gradient(to right, #7fbfff 50%, transparent 50%)'
    : SUCCESS_HIGHLIGHT
  const failureHL = isVertical
    ? 'linear-gradient(to right, #ff7f7f 50%, transparent 50%)'
    : FAILURE_HIGHLIGHT

  function renderToken(token: ContentToken): string {
    const content = sanitizeContentHtml(token.content)
    if (token.highlight === 'success') {
      return `<span style="background: ${successHL};">${content}</span>`
    }
    if (token.highlight === 'failure') {
      return `<span style="background: ${failureHL};">${content}</span>`
    }
    return `<span>${content}</span>`
  }

  function renderParagraph(paragraph: ContentParagraph): string {
    return `<p class="log-message">
    ${paragraph.tokens.map(renderToken).join('<br>')}
</p>`
  }

  function renderSpeaker(entry: OutputSpeakerEntry): string {
    const speakerColor = sanitizeCssColor(entry.color)
    const messages = `<div class="log-messages">
    ${entry.paragraphs.map(renderParagraph).join('\n')}
</div>`

    if (entry.style === 'character') {
      return `<div class="log-entry log-entry--speaker" style="--log-speaker-color: ${speakerColor};">
    <span class="log-speaker">${escapeText(entry.displayName ?? entry.charName)}</span>
    ${messages}
</div>`
    }

    if (entry.style === 'scene') {
      if (entry.displayName === null) {
        return `<div class="log-entry log-entry--scene log-entry--narration">
    ${messages}
</div>`
      }

      return `<div class="log-entry log-entry--scene" style="--log-speaker-color: ${speakerColor};">
    <h3 class="log-scene">${escapeText(entry.displayName ?? entry.charName)}</h3>
    ${messages}
</div>`
    }

    return `<div class="log-entry log-entry--info">
    <h4 class="log-info-title">${escapeText(entry.displayName ?? entry.charName)}</h4>
    ${messages}
</div>`
  }

  function renderSection(section: OutputSection, index: number): string {
    const sectionTitleId = `log-section-${index}-title`
    const isPrimary = isPrimaryTab(section.tabName)
    const className = isPrimary
      ? 'log-section log-section--primary'
      : `log-section log-section--tab ${section.tabVisibilityClass}`
    const title = isPrimary ? '' : ` title="${escapeText(section.tabName)}"`
    const tabNameLabel = isPrimary
      ? ''
      : `    <span class="log-section-tab-name" aria-hidden="true">${escapeText(section.tabName)}</span>\n`

    return `<section class="${className}"${title} aria-labelledby="${sectionTitleId}">
    <h2 id="${sectionTitleId}" class="log-section-title">${escapeText(section.tabName)}</h2>
${tabNameLabel}    ${section.entries.map(renderSpeaker).join('\n')}
</section>`
  }

  const tabControls = outputModel.toggles
    .map(
      (tab) => `
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
    )
    .join('\n')

  const content = outputModel.sections.map(renderSection).join('\n')

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
        ${buildStyle(settings, outputModel)}
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

/**
 * 設定値を埋め込んだ `<style>` タグ文字列を生成する。
 *
 * @param settings - フレーム色・背景色・文字色などの整形設定
 * @param outputModel - タブ色の CSS custom property 生成に使う出力モデル
 * @returns style タグを含む HTML 文字列
 */
function buildStyle(
  settings: LogmakeSettings,
  outputModel?: OutputModel
): string {
  const frame = sanitizeCssColor(settings.frameColor)
  const name = sanitizeCssColor(settings.nameColor)
  const back = settings.darkMode ? DARK_BACK_COLOR : LIGHT_BACK_COLOR
  const textColor = settings.darkMode ? '#d0d0d0' : '#333333'
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
    word-break: normal;
    word-break: auto-phrase;
    overflow-wrap: anywhere;
  }
  .log-section {
    position: relative;
  }
  .log-section--primary {
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
    word-break: normal;
    word-break: auto-phrase;
    overflow-wrap: anywhere;
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
  .log-entry--info {
    position: relative;
    margin: 2.5rem 1.25rem;
    padding: 1rem 1.5rem .5rem 1rem;
    border: solid 3px #888888;
    border-radius: 8px;
    background: ${back};
    line-height: 1.5;
  }
  .log-info-title {
    position: absolute;
    display: inline-block;
    top: -2.5rem;
    left: .5rem;
    right: auto;
    padding: .5rem;
    line-height: 1;
    background: ${back};
    color: #888888;
    font-weight: bold;
    font-size: 1rem;
    word-break: normal;
    word-break: auto-phrase;
    overflow-wrap: anywhere;
  }
  .log-entry--info .log-message {
    margin: 0;
    color: #888888;
  }
  .log-speaker {
    display: block;
    color: var(--log-speaker-color);
    font-weight: bold;
    word-break: normal;
    word-break: auto-phrase;
    overflow-wrap: anywhere;
  }
  .log-entry--speaker {
    margin: 1.5rem 1rem 1.5rem 0.5rem;
  }
  .log-entry--speaker .log-message {
    color: var(--log-speaker-color);
  }
  .log-scene {
    margin: 0 0 0.25rem .5rem;
    color: var(--log-speaker-color);
    word-break: normal;
    word-break: auto-phrase;
    overflow-wrap: anywhere;
  }
  .log-entry--narration {
    margin: 1rem 1.25rem;
    color: ${textColor};
    opacity: .9;
  }
  .log-entry--narration .log-message {
    padding-inline-start: 1rem;
    border-inline-start: 2px solid rgba(127,127,127,0.35);
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

function buildTabColorRules(outputModel: OutputModel | undefined): string {
  if (!outputModel) {
    return ''
  }

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
        `.${className} { --log-tab-color: ${color}; }\n  .${className}-control { --log-tab-color: ${color}; }`
    )
    .join('\n  ')
}

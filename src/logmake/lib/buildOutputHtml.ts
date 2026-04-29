import {
  FAILURE_HIGHLIGHT,
  SUCCESS_HIGHLIGHT,
  isPrimaryTab,
} from '@/logmake/lib/defaults'
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
  const viewCheck = outputModel.toggles
    .map(
      (tab) => `
                <label for="${tab.inputId}">
                    <input
                        type="checkbox"
                        id="${tab.inputId}"
                        checked="checked"
                        onchange="c_disp(this, '${tab.tabVisibilityClass}')"
                        style="accent-color: ${tab.color};"
                    />
                    <span>${escapeText(tab.name)}</span>
                </label>`
    )
    .join('\n')

  const content = outputModel.sections.map(renderSection).join('\n')

  return `<!DOCTYPE html>
<html lang="ja">
    <head>
        <title>${escapeText(settings.logFileName)}</title>
        <meta charset="UTF-8">
        <script type="text/javascript">
            function c_disp(obj, name) {
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
                <div class="viewCheck">
                    ${viewCheck}
                </div>
            </details>
        </div>
        <div class="box5">
            ${content}
        </div>
    </body>
</html>`
}

/**
 * OutputSection を HTML の div ブロックに変換する。
 * 主要タブは 'mainBlock'、サブタブはタブカラーのボーダーを付与する。
 *
 * @param section - 変換対象のセクションデータ
 * @returns HTML 文字列
 */
function renderSection(section: OutputSection): string {
  const className = isPrimaryTab(section.tabName)
    ? 'mainBlock'
    : section.tabVisibilityClass

  const style = isPrimaryTab(section.tabName)
    ? ''
    : ` style="border-left: 3px solid ${sanitizeCssColor(section.tabColor)};"`

  return `<div class="${className}"${style}>
    ${section.entries.map(renderSpeaker).join('\n')}
</div>`
}

/**
 * OutputSpeakerEntry をスタイル別の HTML ブロックに変換する。
 * character / scene / item で異なるマークアップを生成する。
 *
 * @param entry - 変換対象の発言ブロック
 * @returns HTML 文字列
 */
function renderSpeaker(entry: OutputSpeakerEntry): string {
  if (entry.style === 'character') {
    return `<div class="char" style="color: ${entry.color};">
    <b>${escapeText(entry.charName)}</b>
    ${entry.paragraphs.map(renderParagraph).join('\n')}
</div>`
  }

  if (entry.style === 'scene') {
    return `<p class="KP" style="color: ${entry.color};">${escapeText(entry.charName)}</p>
${entry.paragraphs.map(renderParagraph).join('\n')}`
  }

  return `<div class="box">
    <span class="box-title">${escapeText(entry.charName)}</span>
    ${entry.paragraphs.map(renderParagraph).join('\n')}
</div>`
}

/**
 * ContentParagraph を `<p>` タグに変換する。
 *
 * @param paragraph - 変換対象の段落
 * @returns HTML 文字列
 */
function renderParagraph(paragraph: ContentParagraph): string {
  return `<p class="bbb">
    ${paragraph.tokens.map(renderToken).join('<br>')}
</p>`
}

/**
 * ContentToken を span タグに変換する。
 * highlight の種別に応じてグラデーション背景を付与する。
 *
 * @param token - 変換対象のトークン
 * @returns HTML 文字列
 */
// token.content は CCFOLIA の innerHTML をそのまま通す（意図的・escapeText 不可）。
// エスケープすると CCFOLIA のインライン書式（<b> 等）が壊れる。
function renderToken(token: ContentToken): string {
  if (token.highlight === 'success') {
    return `<span style="background: ${SUCCESS_HIGHLIGHT};">${token.content}</span>`
  }

  if (token.highlight === 'failure') {
    return `<span style="background: ${FAILURE_HIGHLIGHT};">${token.content}</span>`
  }

  return `<span>${token.content}</span>`
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
  const back = sanitizeCssColor(settings.backColor)
  return `<style>
  @import url('https://fonts.googleapis.com/css?family=Noto+Sans+JP');
  @import url('https://fonts.googleapis.com/css2?family=New+Tegomin&family=Sawarabi+Mincho&display=swap');
  html {
    font-size: 16px;
  }
  body {
    background-color: ${frame};
    font-family: 'Hiragino Sans', sans-serif;
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
  .viewCheck{
    padding-left: 3rem;
    color: ${name};
  }
  .viewCheck label{
    display: inline-block;
    margin-right: .75rem;
  }
  .box5 {
    padding: 2rem;
    margin: 6rem 2rem 2rem;
    border: double 5px ${frame};
    background-color: ${back};
  }
  .box5 p {
    margin: 0;
    padding: .5rem;
    text-align: left;
  }
  .tab {
    position: relative;
    margin: 1.5rem 0;
    padding: .5rem 1.5rem .5rem 1rem;
    box-sizing: border-box;
    background: rgba(127, 127, 127, 0.1);
    overflow-wrap: break-word;
  }
  .box {
    position: relative;
    margin: 2rem 1rem;
    padding: 1rem 1.5rem .5rem 1rem;
    border: solid 3px #888888;
    border-radius: 8px;
    background: ${back};
    line-height: 1.5;
  }
  .box .box-title {
    position: absolute;
    display: inline-block;
    top: -0.6rem;
    left: .5rem;
    padding: 0 .5rem;
    line-height: 1;
    background: ${back};
    color: #888888;
    font-weight: bold;
  }
  .box p {
    margin: 0;
    color: #888888;
  }
  b {
    display: block;
  }
  .bbb {
    display: block;
    margin: 0rem 0.3rem;
  }
  .char {
    margin: 1.5rem 1rem 1.5rem 0.5rem;
  }
  .KP {
    margin-left: .5rem;
  }
  @media screen and (max-width: 480px){
    html {
      font-size: 14px;
    }
    h1 {
      padding: .2rem .2rem .2rem 1.5rem;
      font-size: 27px;
    }
    .viewCheck{
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
    .box5{
      padding: 0.8rem;
      margin: 5.5rem .6rem .6rem;
    }
  }
  </style>`
}

/**
 * HTML テキストノードに埋め込む文字列をエスケープする。
 *
 * @param text - エスケープ対象の文字列
 * @returns HTML エスケープ済み文字列
 */
function escapeText(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

const SAFE_HEX_COLOR = /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/
const SAFE_RGBA_COLOR = /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+\s*)?\)$/

/**
 * CSS プロパティ値として使用する色文字列を検証し、不正な値は安全なフォールバックに置換する。
 * 許可形式: #RGB, #RRGGBB, rgb(...), rgba(...), transparent
 *
 * @param value - 検証する色文字列
 * @returns 安全な CSS 色文字列
 */
function sanitizeCssColor(value: string): string {
  const trimmed = value.trim()
  if (
    trimmed === 'transparent' ||
    SAFE_HEX_COLOR.test(trimmed) ||
    SAFE_RGBA_COLOR.test(trimmed)
  ) {
    return trimmed
  }
  return '#ffffff'
}

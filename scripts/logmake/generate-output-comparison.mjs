import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { JSDOM } from 'jsdom'
import react from '@vitejs/plugin-react'
import { createServer } from 'vite'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(scriptDir, '../..')
const outputDir = path.join(root, 'docs/logmake-output-comparison')
const fixturePath = path.join(
  root,
  'src/logmake/test/fixtures/coc6-output-visual-comparison.html',
)

const dom = new JSDOM('<!doctype html><html><body></body></html>')
globalThis.DOMParser = dom.window.DOMParser
globalThis.Node = dom.window.Node
globalThis.Element = dom.window.Element

const server = await createServer({
  root,
  configFile: false,
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.join(root, 'src'),
    },
  },
  logLevel: 'error',
  server: { middlewareMode: true, hmr: false, ws: false },
  appType: 'custom',
})

try {
  const [
    { parseLogHtml },
    { createDefaultSettings },
    { getLogmakeSystem },
    {
      buildCandidateCombinedComparisonHtml,
      buildSpeakerAfterLineComparisonHtml,
      buildSpeakerBodyGuideComparisonHtml,
      buildVisualComparisonOutputModel,
    },
  ] = await Promise.all([
    server.ssrLoadModule('/src/logmake/lib/parseLogHtml.ts'),
    server.ssrLoadModule('/src/logmake/lib/defaults.ts'),
    server.ssrLoadModule('/src/logmake/systems/index.ts'),
    server.ssrLoadModule('/src/logmake/test/outputVisualComparison.ts'),
  ])

  const rawHtml = await readFile(fixturePath, 'utf8')
  const system = getLogmakeSystem('CoC6')
  const parsedLog = parseLogHtml(rawHtml, system)
  const outputModel = buildVisualComparisonOutputModel(parsedLog)
  const lightSettings = createDefaultSettings('log-output-visual-comparison')
  const darkSettings = { ...lightSettings, darkMode: true }
  const renderers = {
    buildCandidateCombinedComparisonHtml,
    buildSpeakerAfterLineComparisonHtml,
    buildSpeakerBodyGuideComparisonHtml,
  }

  const variants = [
    createVariants(renderers, outputModel, 'light', 'ライト', lightSettings),
    createVariants(renderers, outputModel, 'dark', 'ダーク', darkSettings),
  ].flat()

  await mkdir(outputDir, { recursive: true })
  await removeGeneratedHtmlFiles(outputDir)
  await Promise.all([
    ...variants.map((variant) =>
      writeFile(path.join(outputDir, variant.fileName), variant.html),
    ),
    writeFile(path.join(outputDir, 'fixture-source.html'), rawHtml),
    writeFile(path.join(outputDir, 'index.html'), buildIndexHtml(variants)),
  ])

  console.log(`Generated logmake output comparison files in ${outputDir}`)
} finally {
  await server.close()
}

async function removeGeneratedHtmlFiles(targetDir) {
  const entries = await readdir(targetDir, { withFileTypes: true })
  await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.html'))
      .map((entry) => rm(path.join(targetDir, entry.name))),
  )
}

function createVariants(renderers, outputModel, themeId, themeLabel, baseSettings) {
  const {
    buildCandidateCombinedComparisonHtml,
    buildSpeakerAfterLineComparisonHtml,
    buildSpeakerBodyGuideComparisonHtml,
  } = renderers
  const suffix = themeId === 'light' ? '' : '-dark'
  return [
    {
      fileName: `speaker-after-line${suffix}.html`,
      label: '名前後ろライン',
      themeLabel,
      html: buildSpeakerAfterLineComparisonHtml(outputModel, {
        ...baseSettings,
        title: `ログ出力比較 - ${themeLabel} - 名前後ろライン`,
      }),
    },
    {
      fileName: `speaker-body-guide${suffix}.html`,
      label: '本文ガイド',
      themeLabel,
      html: buildSpeakerBodyGuideComparisonHtml(outputModel, {
        ...baseSettings,
        title: `ログ出力比較 - ${themeLabel} - 本文ガイド`,
      }),
    },
    {
      fileName: `candidate-combined${suffix}.html`,
      label: '統合候補',
      themeLabel,
      html: buildCandidateCombinedComparisonHtml(outputModel, {
        ...baseSettings,
        title: `ログ出力比較 - ${themeLabel} - 統合候補`,
      }),
    },
  ]
}

function buildIndexHtml(variants) {
  const frames = variants
    .map(
      (variant) => `<section class="variant">
        <h2>${variant.themeLabel} / ${variant.label}</h2>
        <p><a href="./${variant.fileName}" target="_blank" rel="noreferrer">別タブで開く</a></p>
        <iframe title="${variant.themeLabel} ${variant.label}" src="./${variant.fileName}"></iframe>
      </section>`,
    )
    .join('\n')

  return `<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="UTF-8">
    <title>ログ出力比較</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      body {
        margin: 0;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Hiragino Sans", sans-serif;
        background: #f3f4f1;
        color: #202020;
      }
      header {
        padding: 1rem 1.25rem;
        border-bottom: 1px solid #d0d4cc;
        background: #ffffff;
      }
      h1 {
        margin: 0 0 .4rem;
        font-size: 1.2rem;
      }
      header p {
        margin: 0;
        color: #555555;
        font-size: .92rem;
      }
      main {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: 1rem;
        padding: 1rem;
      }
      .variant {
        min-width: 0;
      }
      h2 {
        margin: 0 0 .3rem;
        font-size: 1rem;
      }
      .variant p {
        margin: 0 0 .5rem;
        font-size: .88rem;
      }
      iframe {
        width: 100%;
        height: 78vh;
        border: 1px solid #c8c8c8;
        background: #ffffff;
      }
      @media (max-width: 1100px) {
        main {
          grid-template-columns: 1fr;
        }
        iframe {
          height: 72vh;
        }
      }
    </style>
  </head>
  <body>
    <header>
      <h1>ログ出力比較</h1>
      <p>同一fixtureから生成した本文色・名前マーカー・地の文の候補を、ライト/ダークで比較するための確認ページです。</p>
    </header>
    <main>
      ${frames}
    </main>
  </body>
</html>`
}

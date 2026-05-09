import { fileURLToPath } from 'url'

import { expect, type Download, type Page } from '@playwright/test'
import { createBdd } from 'playwright-bdd'

const { Given, When, Then } = createBdd()

const COC6_FIXTURE = fileURLToPath(
  new URL('../../../src/logmake/test/fixtures/coc6-sample.html', import.meta.url)
)

function fixtureFile(name: string): string {
  return fileURLToPath(
    new URL(`../../../src/logmake/test/fixtures/${name}`, import.meta.url)
  )
}

// page はシナリオ単位で固有なので WeakMap でシナリオ内状態を保持する
const downloads = new WeakMap<Page, Download>()

// -----------------------------------------------------------------------
// Given
// -----------------------------------------------------------------------

Given('基本形式のセッションログがある', async ({ page }) => {
  await page.goto('/logmake/')
  await page.getByLabel('ログHTML').setInputFiles(COC6_FIXTURE)
})

Given('成長判定を含むセッションログがある', async ({ page }) => {
  await page.goto('/logmake/')
  await page.getByLabel('ログHTML').setInputFiles(COC6_FIXTURE)
})

Given('危険な本文 HTML を含むセッションログがある', async ({ page }) => {
  await page.goto('/logmake/')
  await page
    .getByLabel('ログHTML')
    .setInputFiles(fixtureFile('coc6-dangerous-content.html'))
})

Given(/^CoC7 の判定ログ「(.+)」がある$/, async ({ page }, fixture: string) => {
  await page.goto('/logmake/')
  await page.getByLabel('CoC 7版').check()
  await page.getByLabel('ログHTML').setInputFiles(fixtureFile(fixture))
})

// -----------------------------------------------------------------------
// When
// -----------------------------------------------------------------------

When('ログを整形する', async ({ page }) => {
  // アップロードで整形が自動実行されるため、設定タブの操作可能状態を待つ
  await expect(page.getByRole('button', { name: 'HTML をダウンロード' })).toBeEnabled()
})

When('成長技能チェックを開く', async ({ page }) => {
  await page.getByRole('button', { name: '成長技能チェック' }).click()
})

// -----------------------------------------------------------------------
// Then
// -----------------------------------------------------------------------

Then('整形結果にキャラクター名「探索者A」が表示される', async ({ page }) => {
  await expect(
    page.getByText('探索者A').first()
  ).toBeVisible()
})

// waitForEvent('download') は click より前に登録する必要があるため Promise.all を使う
Then('配布用 HTML をダウンロードできる', async ({ page }) => {
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'HTML をダウンロード' }).click(),
  ])
  downloads.set(page, download)
})

Then('ダウンロードした HTML にキャラクター名「探索者A」が含まれる', async ({ page }) => {
  const content = await readDownloadedHtml(page)
  if (!content.includes('探索者A')) {
    throw new Error('ダウンロードファイルに「探索者A」が含まれていません')
  }
})

Then('ダウンロードした HTML では主要タブと補助タブが区別される', async ({ page }) => {
  const content = await readDownloadedHtml(page)
  expect(content).toContain('class="log-section log-section--primary"')
  expect(content).toContain(
    '<span class="log-section-tab-name" aria-hidden="true">雑談</span>'
  )
  expect(content).not.toContain('title="情報"')
  expect(content).not.toContain(
    '<span class="log-section-tab-name" aria-hidden="true">情報</span>'
  )
})

Then('ダウンロードした HTML に危険な本文 HTML が残らない', async ({ page }) => {
  const content = await readDownloadedHtml(page)
  expect(content).toContain('<b>重要</b>')
  expect(content).toContain('山<rt>やま</rt>')
  expect(content).toContain('日本語')
  expect(content).not.toContain('<script>alert')
  expect(content).not.toContain('alert("xss")')
  expect(content).not.toContain('<img')
  expect(content).not.toContain('onerror')
  expect(content).not.toContain('onclick')
  expect(content).not.toContain('javascript:')
})

Then('ダウンロードした HTML を UTF-8 として読める', async ({ page }) => {
  const content = await readDownloadedHtml(page)
  expect(content).toContain('<meta charset="UTF-8">')
  expect(content).toContain('日本語と記号')
})

Then(/^成長サマリーに「(.+)」が表示されている$/, async ({ page }, expected: string) => {
  await expect(page.getByTestId('growth-summary')).toContainText(expected)
})

// CoC7 の成功段階ラベルが growth-summary に表示されることを確認
// buildGrowthSummaryText は ◯${label} 形式なので "ハード成功" は "◯ハード成功" の一部として含まれる
Then(/^判定結果に「(.+)」が表示される$/, async ({ page }, expected: string) => {
  await page.getByRole('button', { name: '成長技能チェック' }).click()
  await expect(page.getByTestId('growth-summary')).toContainText(expected)
})

async function readDownloadedHtml(page: Page): Promise<string> {
  const download = downloads.get(page)
  if (!download) throw new Error('download が記録されていません')

  const stream = await download.createReadStream()
  const chunks: Buffer[] = []
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string))
  }
  return Buffer.concat(chunks).toString('utf-8')
}

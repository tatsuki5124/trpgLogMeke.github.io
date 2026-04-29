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

Given(/^CoC7 の判定ログ「(.+)」がある$/, async ({ page }, fixture: string) => {
  await page.goto('/logmake/')
  await page.getByLabel('CoC 7版').check()
  await page.getByLabel('ログHTML').setInputFiles(fixtureFile(fixture))
})

// -----------------------------------------------------------------------
// When
// -----------------------------------------------------------------------

When('ログを整形する', async ({ page }) => {
  // アップロードで整形が自動実行されるため、display-sample の表示を待つ
  await page.getByTestId('display-sample').waitFor()
})

// 「成長ダイス表示を「なし/あり」」= 成長技能チェック内の「出目」オプションの ON/OFF
// 「出目」を OFF にすると dice 値（＞ 数字）は非表示、キャラクター名・技能名は維持される
When('成長ダイス表示を「なし」に切り替える', async ({ page }) => {
  await openGrowthDetails(page)
  await page.getByLabel('出目').uncheck()
})

When('成長ダイス表示を「あり」に切り替える', async ({ page }) => {
  await openGrowthDetails(page)
  await page.getByLabel('出目').check()
})

// -----------------------------------------------------------------------
// Then
// -----------------------------------------------------------------------

Then('整形結果にキャラクター名「探索者A」が表示される', async ({ page }) => {
  await expect(
    page.getByTestId('display-sample').getByText('探索者A').first()
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
  const download = downloads.get(page)
  if (!download) throw new Error('download が記録されていません')

  const stream = await download.createReadStream()
  const chunks: Buffer[] = []
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string))
  }
  const content = Buffer.concat(chunks).toString('utf-8')
  if (!content.includes('探索者A')) {
    throw new Error('ダウンロードファイルに「探索者A」が含まれていません')
  }
})

// 「出目」を OFF にした後: dice 値パターン（＞ 数字）が summary に出ないことを確認
Then('成長ダイスの結果は表示されない', async ({ page }) => {
  await expect(page.getByTestId('growth-summary')).not.toContainText('＞ ')
})

// 「出目」を OFF にしても: キャラクターセクション（＜名前＞）は summary に残ることを確認
Then('キャラクターごとの成長判定結果は表示される', async ({ page }) => {
  await expect(page.getByTestId('growth-summary')).toContainText('＜')
})

// 「出目」を ON にした後: dice 値パターン（＞ 数字）が summary に表示されることを確認
Then('成長ダイスの結果が表示される', async ({ page }) => {
  await expect(page.getByTestId('growth-summary')).toContainText('＞ ')
})

// CoC7 の成功段階ラベルが growth-summary に表示されていることを確認
// growth-summary は ◯${label} 形式なので "ハード成功" は "◯ハード成功" の一部として含まれる
Then(/^判定結果に「(.+)」が表示される$/, async ({ page }, expected: string) => {
  await expect(page.getByTestId('growth-summary')).toContainText(expected)
})

// -----------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------

async function openGrowthDetails(page: Page) {
  const details = page
    .locator('details')
    .filter({ has: page.locator('summary', { hasText: '成長技能チェック' }) })
  const isOpen = await details.getAttribute('open')
  if (isOpen === null) {
    await page.getByText('成長技能チェック').click()
  }
}

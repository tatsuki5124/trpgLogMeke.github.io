import { fileURLToPath } from 'url'

import type { Download, Page } from '@playwright/test'
import { createBdd } from 'playwright-bdd'

const { Given, When, Then } = createBdd()

const COC6_FIXTURE = fileURLToPath(
  new URL('../../../src/logmake/test/fixtures/coc6-sample.html', import.meta.url)
)

const COC7_FIXTURE = fileURLToPath(
  new URL('../../../src/logmake/test/fixtures/coc7-sample.html', import.meta.url)
)

// page はシナリオ単位で固有なので WeakMap でシナリオ内状態を保持する
const downloads = new WeakMap<Page, Download>()

Given('ログ整形ページを開く', async ({ page }) => {
  await page.goto('/logmake/')
})

When('サンプルログをアップロードする', async ({ page }) => {
  await page.getByLabel('ログHTML').setInputFiles(COC6_FIXTURE)
})

When('CoC7 サンプルログをアップロードする', async ({ page }) => {
  await page.getByLabel('ログHTML').setInputFiles(COC7_FIXTURE)
})

When('システムを「CoC7」に変更する', async ({ page }) => {
  await page.getByLabel('CoC 7版').check()
})

// waitForEvent('download') は click より前に登録する必要があるため Promise.all を使う
When('ダウンロードボタンをクリックしてファイルを受け取る', async ({ page }) => {
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'HTML をダウンロード' }).click(),
  ])
  downloads.set(page, download)
})

When('「初期値成功」の表示チェックを外す', async ({ page }) => {
  await page.getByText('成長技能チェック').click()
  await page.getByLabel('初期値成功').uncheck()
})

When('「初期値成功」の表示チェックをつける', async ({ page }) => {
  await page.getByLabel('初期値成功').check()
})

Then('キャラクター名「探索者A」が表示される', async ({ page }) => {
  await page.getByTestId('display-sample').waitFor()
  await page.getByTestId('display-sample').getByText('探索者A').first().waitFor()
})

Then('ダウンロードファイルに「探索者A」が含まれる', async ({ page }) => {
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

Then(/^成長サマリーに「(.+)」が表示されている$/, async ({ page }, label: string) => {
  await page.getByTestId('growth-summary').waitFor()
  await page.getByTestId('growth-summary').getByText(label).waitFor()
})

Then(/^成長サマリーに「(.+)」が表示されていない$/, async ({ page }, label: string) => {
  await page.getByTestId('growth-summary').waitFor()
  await page
    .getByTestId('growth-summary')
    .getByText(label)
    .waitFor({ state: 'hidden' })
})

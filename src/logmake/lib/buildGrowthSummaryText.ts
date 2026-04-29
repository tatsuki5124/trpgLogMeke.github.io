import type { GrowthAnalysis, GrowthFilters } from '@/logmake/types'

/**
 * 成長分析結果からフィルタ適用後のサマリーテキストを生成する。
 * キャラクター別・ラベル別に整形し、クリップボード貼り付け用のプレーンテキストを返す。
 *
 * @param analysis - analyzeGrowth の戻り値
 * @param filters - 表示するラベル・列のフィルタ条件
 * @param visibleTabs - タブ名をキーとする表示フラグのマップ
 * @returns 改行区切りのサマリーテキスト（表示対象がない場合は空文字列）
 */
export function buildGrowthSummaryText(
  analysis: GrowthAnalysis,
  filters: GrowthFilters,
  visibleTabs: Record<string, boolean>,
): string {
  const sections: string[] = []

  for (const [charName, entriesByLabel] of Object.entries(analysis.byCharacter)) {
    const lines: string[] = []

    for (const label of analysis.labels) {
      if (!filters.labels[label]) {
        continue
      }

      const records = entriesByLabel[label] ?? []
      const visibleRecords = records.filter(
        (record) =>
          visibleTabs[record.tabName] !== false &&
          (filters.visibility.status || !record.status),
      )

      if (visibleRecords.length === 0) {
        continue
      }

      lines.push(`◯${label}`)
      for (const record of visibleRecords) {
        const parts = [
          filters.visibility.tabName ? `[${record.tabName}]` : '',
          record.ginou,
          filters.visibility.value ? `＞ ${record.value}` : '',
        ].filter(Boolean)
        lines.push(parts.join(' '))
      }
      lines.push('')
    }

    if (lines.length > 0) {
      sections.push(`＜${charName}＞\n${lines.join('\n').trimEnd()}`)
    }
  }

  return sections.join('\n\n').trim()
}

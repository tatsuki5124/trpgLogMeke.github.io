import { useEffect, useMemo, useState } from 'react'

import { createGrowthFilters } from '@/logmake/lib/defaults'
import { buildGrowthSummaryText } from '@/logmake/lib/buildGrowthSummaryText'
import { useClipboard } from '@/logmake/hooks/useClipboard'
import formStyles from '@/logmake/styles/forms.module.css'
import type {
  GrowthAnalysis,
  GrowthFilters,
  TabConfig,
} from '@/logmake/types'

interface GrowthCheckProps {
  analysis: GrowthAnalysis | null
  tabs: Record<string, TabConfig>
}

/**
 * 成長判定の一覧表示・フィルタリング・クリップボードコピーを行うコンポーネント。
 *
 * @param props.analysis - 成長判定の分析結果（未解析時は null）
 * @param props.tabs - タブ表示設定のレコード
 */
export function GrowthCheck({ analysis, tabs }: GrowthCheckProps) {
  const [filters, setFilters] = useState<GrowthFilters>(() =>
    createGrowthFilters([])
  )
  const [visibleTabs, setVisibleTabs] = useState<Record<string, boolean>>(() =>
    createVisibleTabs(tabs)
  )
  const [copyMessage, setCopyMessage] = useState<string | null>(null)
  const clipboard = useClipboard()

  useEffect(() => {
    setFilters((current) => createGrowthFilters(analysis?.labels ?? [], current))
  }, [analysis?.labels])

  useEffect(() => {
    setVisibleTabs((current) => syncVisibleTabs(current, tabs))
  }, [tabs])

  const summaryText = useMemo(
    () =>
      analysis ? buildGrowthSummaryText(analysis, filters, visibleTabs) : '',
    [analysis, filters, visibleTabs]
  )

  async function handleCopy() {
    if (!summaryText) {
      setCopyMessage('コピー対象の成長判定結果がありません。')
      return
    }

    const ok = await clipboard.copy(summaryText)
    setCopyMessage(
      ok ? '成長判定結果をコピーしました。' : 'コピーに失敗しました。'
    )
  }

  return (
    <details className={formStyles.detailsBlock}>
      <summary>成長技能チェック</summary>
      {analysis ? (
        <div className={formStyles.growthBox}>
          <table className={formStyles.dispCheck}>
            <tbody>
              <tr>
                <th>タブ表示：</th>
                <td>
                  <div className={formStyles.inlineOptions}>
                    {Object.values(tabs).map((tab) => (
                      <label
                        key={tab.name}
                        className={formStyles.checkboxLabel}
                      >
                        <input
                          checked={visibleTabs[tab.name] ?? true}
                          type="checkbox"
                          onChange={(event) => {
                            const checked = event.currentTarget.checked
                            setVisibleTabs((current) => ({
                              ...current,
                              [tab.name]: checked,
                            }))
                          }}
                        />
                        {tab.name}
                      </label>
                    ))}
                  </div>
                </td>
              </tr>
              <tr>
                <th>ダイス表示：</th>
                <td>
                  <div className={formStyles.inlineOptions}>
                    {analysis.labels.map((label) => (
                      <label key={label} className={formStyles.checkboxLabel}>
                        <input
                          checked={filters.labels[label]}
                          type="checkbox"
                          onChange={(event) => {
                            const checked = event.currentTarget.checked
                            setFilters((current) => ({
                              ...current,
                              labels: {
                                ...current.labels,
                                [label]: checked,
                              },
                            }))
                          }}
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </td>
              </tr>
              <tr>
                <th>オプション：</th>
                <td>
                  <div className={formStyles.inlineOptions}>
                    <label className={formStyles.checkboxLabel}>
                      <input
                        checked={filters.visibility.tabName}
                        type="checkbox"
                        onChange={(event) => {
                          const checked = event.currentTarget.checked
                          setFilters((current) => ({
                            ...current,
                            visibility: {
                              ...current.visibility,
                              tabName: checked,
                            },
                          }))
                        }}
                      />
                      タブ名
                    </label>
                    <label className={formStyles.checkboxLabel}>
                      <input
                        checked={filters.visibility.value}
                        type="checkbox"
                        onChange={(event) => {
                          const checked = event.currentTarget.checked
                          setFilters((current) => ({
                            ...current,
                            visibility: {
                              ...current.visibility,
                              value: checked,
                            },
                          }))
                        }}
                      />
                      出目
                    </label>
                    <label className={formStyles.checkboxLabel}>
                      <input
                        checked={filters.visibility.status}
                        type="checkbox"
                        onChange={(event) => {
                          const checked = event.currentTarget.checked
                          setFilters((current) => ({
                            ...current,
                            visibility: {
                              ...current.visibility,
                              status: checked,
                            },
                          }))
                        }}
                      />
                      ステ依存表示
                    </label>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {copyMessage ? (
            <p className={formStyles.metaLine}>{copyMessage}</p>
          ) : null}

          <pre className={formStyles.summary} data-testid="growth-summary">
            {summaryText || '表示対象がありません。'}
          </pre>
          <button
            className={formStyles.secondaryButton}
            type="button"
            onClick={handleCopy}
          >
            {clipboard.isCopying ? 'コピー中...' : '結果をコピー'}
          </button>
        </div>
      ) : (
        <div className={formStyles.emptyState}>
          ログを読み込むと成長判定の集計結果がここに表示されます。
        </div>
      )}
    </details>
  )
}

function createVisibleTabs(
  tabs: Record<string, TabConfig>
): Record<string, boolean> {
  return Object.fromEntries(Object.keys(tabs).map((tabName) => [tabName, true]))
}

function syncVisibleTabs(
  current: Record<string, boolean>,
  tabs: Record<string, TabConfig>
): Record<string, boolean> {
  return Object.fromEntries(
    Object.keys(tabs).map((tabName) => [tabName, current[tabName] ?? true])
  )
}

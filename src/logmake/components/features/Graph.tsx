import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js'
import { useEffect, useRef, useState } from 'react'
import { Bar } from 'react-chartjs-2'

import { GRAPH_LABELS, graphBuckets } from '@/logmake/lib/graphBuckets'
import formStyles from '@/logmake/styles/forms.module.css'
import type {
  CharacterConfig,
  DiceRollAnalysis,
  TabConfig,
} from '@/logmake/types'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

type GraphType = 'grouped' | 'stacked'

interface GraphProps {
  rollAnalysis: DiceRollAnalysis | null
  characters: Record<string, CharacterConfig>
  tabs: Record<string, TabConfig>
}

export function Graph({ rollAnalysis, characters, tabs }: GraphProps) {
  const [graphType, setGraphType] = useState<GraphType>('grouped')
  const [visibleTabs, setVisibleTabs] = useState<Record<string, boolean>>(() =>
    createVisibleTabs(tabs)
  )
  const chartRef = useRef<ChartJS<'bar'>>(null)

  useEffect(() => {
    setVisibleTabs((current) => syncVisibleTabs(current, tabs))
  }, [tabs])

  if (!rollAnalysis || rollAnalysis.records.length === 0) {
    return null
  }

  const datasets = Object.entries(rollAnalysis.byCharacter).map(([charName, records]) => {
    const visibleRecords = records.filter(
      (record) => visibleTabs[record.tabName] !== false
    )
    return {
      label: charName,
      data: graphBuckets(visibleRecords),
      backgroundColor: characters[charName]?.color ?? '#6b8e23',
    }
  })

  const isStacked = graphType === 'stacked'

  function handleDownload() {
    const canvas = chartRef.current?.canvas
    if (!canvas) return
    const link = document.createElement('a')
    link.download = 'graph.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <div className={formStyles.graphBlock} data-testid="graph-root">
      <div className={formStyles.graphControls}>
        {Object.values(tabs).map((tab) => (
          <label key={tab.name} className={formStyles.checkboxLabel}>
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
        <label className={formStyles.radioLabel}>
          <input
            type="radio"
            name="graph-type"
            checked={graphType === 'grouped'}
            onChange={() => setGraphType('grouped')}
          />
          グループ棒グラフ
        </label>
        <label className={formStyles.radioLabel}>
          <input
            type="radio"
            name="graph-type"
            checked={graphType === 'stacked'}
            onChange={() => setGraphType('stacked')}
          />
          積み上げ棒グラフ
        </label>
        <button
          className={formStyles.secondaryButton}
          type="button"
          onClick={handleDownload}
        >
          PNG ダウンロード
        </button>
      </div>
      <Bar
        ref={chartRef}
        data={{
          labels: GRAPH_LABELS,
          datasets,
        }}
        options={{
          responsive: true,
          scales: {
            x: {
              stacked: isStacked,
              title: { display: true, text: '出目' },
            },
            y: {
              stacked: isStacked,
              beginAtZero: true,
              ticks: { stepSize: 1 },
              title: { display: true, text: '回数' },
            },
          },
        }}
      />
    </div>
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

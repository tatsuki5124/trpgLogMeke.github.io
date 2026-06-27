import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { Graph } from '@/logmake/components/features/Graph'
import type { DiceAnalysis } from '@/logmake/types'

vi.mock('react-chartjs-2', async () => {
  const { forwardRef } = await vi.importActual<typeof import('react')>('react')
  return {
    Bar: forwardRef<HTMLDivElement, { data: unknown }>(({ data }, ref) => (
      <div
        ref={ref}
        data-testid="bar-chart"
        data-chart-data={JSON.stringify(data)}
      />
    )),
  }
})

const rollAnalysis: DiceAnalysis = {
  records: [
    {
      id: 'entry-0-dice-0-0',
      entryId: 'entry-0',
      charName: '探索者A',
      tabName: 'メイン',
      value: 10,
      dice: {
        rawText: 'CCB&lt;=50 目星 ＞ 10 ＞ 成功',
        command: 'CCB&lt;=50',
        resultText: '成功',
        primaryRoll: 10,
        targets: [],
      },
    },
    {
      id: 'entry-1-dice-0-0',
      entryId: 'entry-1',
      charName: '探索者A',
      tabName: '雑談',
      value: 90,
      dice: {
        rawText: 'CBR(50,40) ＞ 90[失敗,失敗] ＞ 失敗',
        command: 'CBR(50,40)',
        resultText: '失敗',
        primaryRoll: 90,
        targets: [],
      },
    },
  ],
  byCharacter: {},
  warnings: [],
}
rollAnalysis.byCharacter = { 探索者A: rollAnalysis.records }

describe('Graph', () => {
  it('uses DiceAnalysis and keeps graph tab visibility separate from TabConfig.visible', () => {
    const tabs = {
      メイン: { name: 'メイン', color: '#fff', visible: false },
      雑談: { name: '雑談', color: '#ccc', visible: true },
    }
    render(
      <Graph
        rollAnalysis={rollAnalysis}
        characters={{ 探索者A: { name: '探索者A', color: '#228b22', style: 'character' } }}
        tabs={tabs}
      />
    )

    let chartData = JSON.parse(
      screen.getByTestId('bar-chart').getAttribute('data-chart-data') ?? ''
    ) as { datasets: Array<{ data: number[] }> }
    expect(chartData.datasets[0].data[1]).toBe(1)
    expect(chartData.datasets[0].data[17]).toBe(1)

    fireEvent.click(screen.getByLabelText('メイン'))

    chartData = JSON.parse(
      screen.getByTestId('bar-chart').getAttribute('data-chart-data') ?? ''
    ) as { datasets: Array<{ data: number[] }> }
    expect(chartData.datasets[0].data[1]).toBe(0)
    expect(chartData.datasets[0].data[17]).toBe(1)
    expect(tabs.メイン.visible).toBe(false)
  })
})

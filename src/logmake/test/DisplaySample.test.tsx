import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { DisplaySample } from '@/logmake/components/features/DisplaySample'

describe('DisplaySample', () => {
  it('renders a button and dialog containing display style samples', () => {
    render(<DisplaySample />)

    expect(
      screen.getByRole('button', { name: '表示形式サンプル' })
    ).toBeInTheDocument()
    expect(screen.getByTestId('display-sample')).toBeInTheDocument()
    expect(
      screen.getByText('情報を選ぶとこんな感じで表示されます')
    ).toBeInTheDocument()
    expect(
      screen.getByText('場面を選ぶとこんな感じで表示されます')
    ).toBeInTheDocument()
  })

  it('compact=true のとき "?" ボタンを描画する', () => {
    render(<DisplaySample compact />)

    expect(screen.getByRole('button', { name: '?' })).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: '表示形式サンプル' })
    ).not.toBeInTheDocument()
  })

  it('場面ブロックの名前を h3 要素で描画する', () => {
    render(<DisplaySample />)

    const sceneEl = screen.getByText('場面名（KPなど）')
    expect(sceneEl.tagName).toBe('H3')
  })
})

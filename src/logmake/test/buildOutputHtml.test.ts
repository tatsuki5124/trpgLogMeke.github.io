import { readFileSync } from 'fs'
import path from 'path'

import { describe, expect, it } from 'vitest'

import { buildOutputHtml } from '@/logmake/lib/buildOutputHtml'
import { buildOutputModel } from '@/logmake/lib/buildOutputModel'
import { createDefaultSettings } from '@/logmake/lib/defaults'
import { parseLogHtml } from '@/logmake/lib/parseLogHtml'
import { getLogmakeSystem } from '@/logmake/systems'
import type { OutputModel } from '@/logmake/types'

const FIXTURE_DIR = path.resolve(__dirname, 'fixtures')
const COC6_SYSTEM = getLogmakeSystem('CoC6')

describe('buildOutputHtml', () => {
  it('renders output model content and tab toggles into a standalone html string', () => {
    const html = readFileSync(
      path.join(FIXTURE_DIR, 'coc6-sample.html'),
      'utf8'
    )
    const parsed = parseLogHtml(html, COC6_SYSTEM)
    const outputModel = buildOutputModel(parsed, {
      tabs: parsed.tabs,
      characters: parsed.characters,
    })

    const output = buildOutputHtml(outputModel, {
      ...createDefaultSettings('sample-log'),
      title: 'テストログ',
    })

    expect(output).toContain('<title>sample-log</title>')
    expect(output).toContain('テストログ')
    expect(output).toContain('探索者A')
    expect(output).toContain('雑談')
    expect(output).toContain('linear-gradient(transparent 70%, #ff7f7f 0%)')
  })

  it('escapes special characters in title, logFileName, and tab names', () => {
    const emptyModel: OutputModel = { sections: [], toggles: [] }
    const output = buildOutputHtml(emptyModel, {
      ...createDefaultSettings('file<&>name'),
      title: '<script>alert(1)</script>',
    })

    expect(output).not.toContain('<script>alert(1)</script>')
    expect(output).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
    expect(output).not.toContain('<title>file<&>name</title>')
    expect(output).toContain('&lt;&amp;&gt;')
  })

  it('escapes special characters in character names and tab toggle labels', () => {
    const modelWithSpecialNames: OutputModel = {
      sections: [
        {
          tabName: 'タブ<"quoted">',
          tabColor: '#ff0000',
          tabVisibilityClass: 'logmake-tab-0',
          entries: [],
        },
      ],
      toggles: [
        {
          name: 'タブ<"quoted">',
          color: '#ff0000',
          inputId: 'logmake-tab-0-toggle',
          tabVisibilityClass: 'logmake-tab-0',
        },
      ],
    }
    const output = buildOutputHtml(
      modelWithSpecialNames,
      createDefaultSettings('test')
    )

    expect(output).not.toContain('タブ<"quoted">')
    expect(output).toContain('&lt;&quot;quoted&quot;&gt;')
    expect(output).toContain('id="logmake-tab-0-toggle"')
    expect(output).toContain('onchange="c_disp(this, \'logmake-tab-0\')"')
    expect(output).not.toContain('タブ&lt;&quot;quoted&quot;&gt; tab')
  })

  it('inserts valid hex color values into style attributes unchanged', () => {
    const emptyModel: OutputModel = { sections: [], toggles: [] }
    const output = buildOutputHtml(emptyModel, {
      ...createDefaultSettings('test'),
      frameColor: '#123456',
      backColor: '#abcdef',
    })

    expect(output).toContain('#123456')
    expect(output).toContain('#abcdef')
  })

  it('inserts valid rgba color values into style attributes unchanged', () => {
    const emptyModel: OutputModel = { sections: [], toggles: [] }
    const output = buildOutputHtml(emptyModel, {
      ...createDefaultSettings('test'),
      frameColor: 'rgba(255,255,255,0)',
      backColor: 'rgba(100, 149, 237, 0.5)',
    })

    expect(output).toContain('rgba(255,255,255,0)')
    expect(output).toContain('rgba(100, 149, 237, 0.5)')
  })

  it('replaces invalid CSS color values in settings with a safe fallback', () => {
    const emptyModel: OutputModel = { sections: [], toggles: [] }
    const output = buildOutputHtml(emptyModel, {
      ...createDefaultSettings('test'),
      frameColor: '#fff; } body { display: none }',
      nameColor: 'javascript:alert(1)',
      backColor: 'expression(alert(1))',
    })

    expect(output).not.toContain('display: none')
    expect(output).not.toContain('javascript:')
    expect(output).not.toContain('expression(')
  })

  it('replaces invalid CSS color in section tabColor with a safe fallback', () => {
    const model: OutputModel = {
      sections: [
        {
          tabName: '雑談',
          tabColor: '#ff0000; } body { display: none }',
          tabVisibilityClass: 'logmake-tab-0',
          entries: [],
        },
      ],
      toggles: [],
    }

    const output = buildOutputHtml(model, createDefaultSettings('test'))

    expect(output).not.toContain('display: none')
  })
})

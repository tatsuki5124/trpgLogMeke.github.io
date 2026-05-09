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
          tabVisibilityClass: 'log-tab-0',
          entries: [],
        },
      ],
      toggles: [
        {
          name: 'タブ<"quoted">',
          color: '#ff0000',
          inputId: 'log-tab-0-toggle',
          tabVisibilityClass: 'log-tab-0',
        },
      ],
    }
    const output = buildOutputHtml(
      modelWithSpecialNames,
      createDefaultSettings('test')
    )

    expect(output).not.toContain('タブ<"quoted">')
    expect(output).toContain('&lt;&quot;quoted&quot;&gt;')
    expect(output).toContain('id="log-tab-0-toggle"')
    expect(output).toContain('onchange="toggleLogTab(this, \'log-tab-0\')"')
    expect(output).not.toContain('タブ&lt;&quot;quoted&quot;&gt; tab')
  })

  it('renders semantic log frame, sections, hidden section titles, and no legacy classes', () => {
    const model: OutputModel = {
      sections: [
        {
          tabName: '雑談',
          tabColor: '#ff0000',
          tabVisibilityClass: 'log-tab-0',
          entries: [],
        },
      ],
      toggles: [],
    }
    const output = buildOutputHtml(model, createDefaultSettings('test'))

    expect(output).toContain('<main class="log-frame">')
    expect(output).toContain(
      '<section class="log-section log-section--tab log-tab-0" title="雑談" aria-labelledby="log-section-0-title">'
    )
    expect(output).toContain(
      '<h2 id="log-section-0-title" class="log-section-title">雑談</h2>'
    )
    expect(output).toContain(
      '<span class="log-section-tab-name" aria-hidden="true">雑談</span>'
    )
    expect(output).toContain('.log-section-title')
    expect(output).toContain('.log-section-tab-name')
    expect(output).toContain('padding: 1.5rem .75rem 1rem;')
    expect(output).not.toContain('padding: 2rem 1.75rem 1.25rem;')
    expect(output).not.toMatch(/class="[^"]*\bbox5\b/)
    expect(output).not.toMatch(/class="[^"]*\bbbb\b/)
    expect(output).not.toMatch(/class="[^"]*\bbox\b/)
    expect(output).not.toMatch(/class="[^"]*\bmainBlock\b/)
    expect(output).not.toMatch(/class="[^"]*\bviewCheck\b/)
    expect(output).not.toMatch(/class="[^"]*\blog-section--main\b/)
    expect(output).not.toContain('c_disp')
    expect(output).not.toMatch(/class="[^"]*\bKP\b/)
  })

  it('treats main and info tabs as primary sections without visible tab labels', () => {
    const model: OutputModel = {
      sections: [
        {
          tabName: 'メイン',
          tabColor: 'rgba(255,255,255,0)',
          tabVisibilityClass: '',
          entries: [],
        },
        {
          tabName: '情報',
          tabColor: 'rgba(255,255,255,0)',
          tabVisibilityClass: '',
          entries: [],
        },
      ],
      toggles: [],
    }
    const output = buildOutputHtml(model, createDefaultSettings('test'))

    expect(output).toContain(
      '<section class="log-section log-section--primary" aria-labelledby="log-section-0-title">'
    )
    expect(output).toContain(
      '<section class="log-section log-section--primary" aria-labelledby="log-section-1-title">'
    )
    expect(output).not.toContain('title="情報"')
    expect(output).not.toContain(
      '<span class="log-section-tab-name" aria-hidden="true">情報</span>'
    )
    expect(output).not.toContain('log-section--main')
  })

  it('escapes visible labels for non-primary tabs', () => {
    const model: OutputModel = {
      sections: [
        {
          tabName: '雑談<script>alert(1)</script>',
          tabColor: '#ff0000',
          tabVisibilityClass: 'log-tab-0',
          entries: [],
        },
      ],
      toggles: [],
    }
    const output = buildOutputHtml(model, createDefaultSettings('test'))

    expect(output).toContain(
      '<span class="log-section-tab-name" aria-hidden="true">雑談&lt;script&gt;alert(1)&lt;/script&gt;</span>'
    )
    expect(output).not.toContain('<script>alert(1)</script>')
  })

  it('sanitizes body content without escaping allowed inline markup wholesale', () => {
    const model: OutputModel = {
      sections: [
        {
          tabName: 'メイン',
          tabColor: 'rgba(255,255,255,0)',
          tabVisibilityClass: '',
          entries: [
            {
              charName: '探索者A',
              color: '#333333',
              style: 'character',
              paragraphs: [
                {
                  tokens: [
                    {
                      content:
                        '<b>重要</b><span onclick="alert(1)">本文</span><img src=x onerror="alert(1)"><script>alert(1)</script>',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      toggles: [],
    }

    const output = buildOutputHtml(model, createDefaultSettings('test'))

    expect(output).toContain('<b>重要</b>')
    expect(output).toContain('<span>本文</span>')
    expect(output).not.toContain('<script>alert')
    expect(output).not.toContain('alert(1)')
    expect(output).not.toContain('<img')
    expect(output).not.toContain('onclick')
    expect(output).not.toContain('onerror')
  })

  it('inserts valid hex color values into style attributes unchanged', () => {
    const emptyModel: OutputModel = { sections: [], toggles: [] }
    const output = buildOutputHtml(emptyModel, {
      ...createDefaultSettings('test'),
      frameColor: '#123456',
      nameColor: '#abcdef',
    })

    expect(output).toContain('#123456')
    expect(output).toContain('#abcdef')
  })

  it('inserts valid rgba color values into style attributes unchanged', () => {
    const emptyModel: OutputModel = { sections: [], toggles: [] }
    const output = buildOutputHtml(emptyModel, {
      ...createDefaultSettings('test'),
      frameColor: 'rgba(255,255,255,0)',
      nameColor: 'rgba(100, 149, 237, 0.5)',
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
    })

    expect(output).not.toContain('display: none')
    expect(output).not.toContain('javascript:')
  })

  it('uses fixed light and dark background colors', () => {
    const emptyModel: OutputModel = { sections: [], toggles: [] }
    const lightOutput = buildOutputHtml(
      emptyModel,
      createDefaultSettings('test')
    )
    const darkOutput = buildOutputHtml(emptyModel, {
      ...createDefaultSettings('test'),
      darkMode: true,
    })

    expect(lightOutput).toContain('background-color: #ffffff')
    expect(darkOutput).toContain('background-color: #2d2d2d')
  })

  it('uses vertical writing mode styles when configured', () => {
    const model: OutputModel = {
      sections: [
        {
          tabName: '雑談',
          tabColor: '#ff0000',
          tabVisibilityClass: 'log-tab-0',
          entries: [
            {
              charName: '探索者A',
              color: '#333333',
              style: 'character',
              paragraphs: [
                {
                  tokens: [
                    {
                      content: '成功',
                      highlight: 'success',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      toggles: [],
    }

    const output = buildOutputHtml(model, {
      ...createDefaultSettings('test'),
      writingMode: 'vertical',
    })

    expect(output).toContain('writing-mode: vertical-rl')
    expect(output).toContain('--log-tab-color: #ff0000')
    expect(output).toContain('border-inline-start: 3px solid var(--log-tab-color)')
    expect(output).toContain('right: -1rem;')
    expect(output).toContain(
      'linear-gradient(to right, #7fbfff 50%, transparent 50%)'
    )
  })

  it('縦書きモードでも logical property でタブ境界線を指定する', () => {
    const model: OutputModel = {
      sections: [{ tabName: '雑談', tabColor: '#ff0000', tabVisibilityClass: 'log-tab-0', entries: [] }],
      toggles: [],
    }
    const output = buildOutputHtml(model, { ...createDefaultSettings('test'), writingMode: 'vertical' })

    expect(output).toContain('border-inline-start: 3px solid var(--log-tab-color)')
    expect(output).not.toContain('border-left: 3px solid #ff0000')
    expect(output).not.toContain('border-top: 3px solid #ff0000')
  })

  it('縦書きモードでは成功ハイライトに右半分グラデーションを使用する', () => {
    const html = readFileSync(path.join(FIXTURE_DIR, 'coc6-sample.html'), 'utf8')
    const parsed = parseLogHtml(html, COC6_SYSTEM)
    const outputModel = buildOutputModel(parsed, { tabs: parsed.tabs, characters: parsed.characters })
    const output = buildOutputHtml(outputModel, { ...createDefaultSettings('test'), writingMode: 'vertical' })

    expect(output).toContain('linear-gradient(to right, #7fbfff 50%, transparent 50%)')
    expect(output).not.toContain('linear-gradient(transparent 70%, #7fbfff 0%)')
  })

  it('ダークモードではタブ背景色に rgba(200,200,200,0.06) を使用する', () => {
    const model: OutputModel = {
      sections: [{ tabName: '雑談', tabColor: '#888888', tabVisibilityClass: 'log-tab-0', entries: [] }],
      toggles: [],
    }
    const output = buildOutputHtml(model, { ...createDefaultSettings('test'), darkMode: true })

    expect(output).toContain('rgba(200,200,200,0.06)')
    expect(output).not.toContain('rgba(127,127,127,0.1)')
  })

  it('replaces invalid CSS color in section tabColor with a safe fallback', () => {
    const model: OutputModel = {
      sections: [
        {
          tabName: '雑談',
          tabColor: '#ff0000; } body { display: none }',
          tabVisibilityClass: 'log-tab-0',
          entries: [],
        },
      ],
      toggles: [],
    }

    const output = buildOutputHtml(model, createDefaultSettings('test'))

    expect(output).not.toContain('display: none')
  })

  it('renders narration entries without speaker or scene heading', () => {
    const model = {
      sections: [
        {
          tabName: 'メイン',
          tabColor: 'rgba(255,255,255,0)',
          tabVisibilityClass: '',
          entries: [
            {
              charName: 'KP',
              displayName: null,
              color: '#333333',
              style: 'scene',
              paragraphs: [{ tokens: [{ content: '地の文' }] }],
            },
          ],
        },
      ],
      toggles: [],
    } as unknown as OutputModel
    const output = buildOutputHtml(model, createDefaultSettings('test'))

    expect(output).toContain('log-entry log-entry--scene log-entry--narration')
    expect(output).toContain('<p class="log-message">')
    expect(output).not.toContain('<h3 class="log-scene">KP</h3>')
    expect(output).not.toContain('<span class="log-speaker">KP</span>')
  })

  it('renders scene headings as h3 without forcing them to body text size', () => {
    const model: OutputModel = {
      sections: [
        {
          tabName: 'メイン',
          tabColor: 'rgba(255,255,255,0)',
          tabVisibilityClass: '',
          entries: [
            {
              charName: '場面：地下室前',
              displayName: '場面：地下室前',
              color: '#7040a0',
              style: 'scene',
              paragraphs: [{ tokens: [{ content: '地下室の前。' }] }],
            },
          ],
        },
      ],
      toggles: [],
    }
    const output = buildOutputHtml(model, createDefaultSettings('test'))

    expect(output).toContain('<h3 class="log-scene">場面：地下室前</h3>')
    expect(output).toContain('.log-scene {')
    expect(output).not.toContain(`.log-scene {
    margin: 0 0 0.25rem .5rem;
    color: var(--log-speaker-color);
    font-size: 1rem;`)
  })

  it('renders tab and speaker colors through sanitized CSS custom properties', () => {
    const model: OutputModel = {
      sections: [
        {
          tabName: '雑談',
          tabColor: '#ff0000',
          tabVisibilityClass: 'log-tab-0',
          entries: [
            {
              charName: '探索者A',
              color: '#333333',
              style: 'character',
              paragraphs: [{ tokens: [{ content: '本文' }] }],
            },
          ],
        },
      ],
      toggles: [
        {
          name: '雑談',
          color: '#ff0000',
          inputId: 'log-tab-0-toggle',
          tabVisibilityClass: 'log-tab-0',
        },
      ],
    }
    const output = buildOutputHtml(model, createDefaultSettings('test'))

    expect(output).toContain('.log-tab-0 { --log-tab-color: #ff0000; }')
    expect(output).toContain('.log-tab-0-control { --log-tab-color: #ff0000; }')
    expect(output).toContain('accent-color: var(--log-tab-color);')
    expect(output).toContain('style="--log-speaker-color: #333333;"')
    expect(output).toContain('color: var(--log-speaker-color);')
    expect(output).toContain('.log-entry--speaker .log-message')
  })

  it('uses left-top info titles in horizontal writing mode', () => {
    const output = buildOutputHtml(
      { sections: [], toggles: [] },
      createDefaultSettings('test'),
    )

    expect(output).toContain('left: .5rem;')
    expect(output).toContain('right: auto;')
  })
})

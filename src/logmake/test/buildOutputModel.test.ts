import { describe, expect, it } from 'vitest'

import { buildOutputModel } from '@/logmake/lib/buildOutputModel'
import type { ParsedLog, TabConfig } from '@/logmake/types'

const paragraph = (content: string) => ({ tokens: [{ content }] })

describe('buildOutputModel', () => {
  it('excludes hidden tabs and groups consecutive entries by tab and speaker', () => {
    const tabs: Record<string, TabConfig> = {
      メイン: {
        name: 'メイン',
        color: 'rgba(255,255,255,0)',
        visible: true,
      },
      '雑談 "quote"': {
        name: '雑談 "quote"',
        color: '#123456',
        visible: true,
      },
      秘密: {
        name: '秘密',
        color: '#654321',
        visible: false,
      },
    }
    const parsedLog: ParsedLog = {
      tabs,
      characters: {
        探索者A: {
          name: '探索者A',
          color: '#111111',
          style: 'character',
        },
      },
      warnings: [],
      entries: [
        {
          id: '1',
          tabName: 'メイン',
          charName: '探索者A',
          charColor: '#111111',
          sourceHtml: 'main',
          paragraphs: [paragraph('main')],
        },
        {
          id: '2',
          tabName: '雑談 "quote"',
          charName: '探索者A',
          charColor: '#111111',
          sourceHtml: 'chat 1',
          paragraphs: [paragraph('chat 1')],
        },
        {
          id: '3',
          tabName: '雑談 "quote"',
          charName: '探索者A',
          charColor: '#111111',
          sourceHtml: 'chat 2',
          paragraphs: [paragraph('chat 2')],
        },
        {
          id: '4',
          tabName: '雑談 "quote"',
          charName: 'NPC',
          charColor: '#222222',
          sourceHtml: 'npc',
          paragraphs: [paragraph('npc')],
        },
        {
          id: '5',
          tabName: '秘密',
          charName: '探索者A',
          charColor: '#111111',
          sourceHtml: 'hidden',
          paragraphs: [paragraph('hidden')],
        },
      ],
    }

    const model = buildOutputModel(parsedLog, {
      tabs,
      characters: parsedLog.characters,
    })

    expect(model.sections).toHaveLength(2)
    expect(model.sections.map((section) => section.tabName)).toEqual([
      'メイン',
      '雑談 "quote"',
    ])
    expect(model.sections[1].entries).toHaveLength(2)
    expect(model.sections[1].entries[0]).toMatchObject({
      charName: '探索者A',
      color: '#111111',
      style: 'character',
    })
    expect(model.sections[1].entries[0].paragraphs).toHaveLength(2)
    expect(model.sections[1].entries[1]).toMatchObject({
      charName: 'NPC',
      color: '#222222',
      style: 'item',
    })
  })

  it('keeps user-facing tab names separate from safe DOM identifiers', () => {
    const tabs: Record<string, TabConfig> = {
      メイン: {
        name: 'メイン',
        color: 'rgba(255,255,255,0)',
        visible: true,
      },
      '雑談 "quote"': {
        name: '雑談 "quote"',
        color: '#123456',
        visible: true,
      },
    }
    const parsedLog: ParsedLog = {
      tabs,
      characters: {},
      warnings: [],
      entries: [
        {
          id: '1',
          tabName: '雑談 "quote"',
          charName: 'NPC',
          charColor: '#222222',
          sourceHtml: 'chat',
          paragraphs: [paragraph('chat')],
        },
      ],
    }

    const model = buildOutputModel(parsedLog, { tabs, characters: {} })

    expect(model.toggles).toEqual([
      {
        name: '雑談 "quote"',
        color: '#123456',
        inputId: 'log-tab-0-toggle',
        tabVisibilityClass: 'log-tab-0',
      },
    ])
    expect(model.sections[0].tabVisibilityClass).toBe('log-tab-0')
    expect(model.sections[0].tabVisibilityClass).not.toContain('雑談')
  })
})

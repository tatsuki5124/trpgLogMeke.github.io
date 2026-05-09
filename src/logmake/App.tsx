import { useEffect, useState } from 'react'

import { BasicSettings } from '@/logmake/components/features/BasicSettings'
import { CharacterSettings } from '@/logmake/components/features/CharacterSettings'
import { DisplaySample } from '@/logmake/components/features/DisplaySample'
import { DownloadActions } from '@/logmake/components/features/DownloadActions'
import { FileUpload } from '@/logmake/components/features/FileUpload'
import { Graph } from '@/logmake/components/features/Graph'
import { GrowthCheck } from '@/logmake/components/features/GrowthCheck'
import { TabSettings } from '@/logmake/components/features/TabSettings'
import { useLogmakePageState } from '@/logmake/hooks/useLogmakePageState'
import styles from '@/logmake/styles/page.module.css'

type ActiveTab = 'settings' | 'growth' | 'graph'

/** ログ整形ページのルートコンポーネント。useLogmakePageState で状態を管理し各機能コンポーネントに配布する */
function App() {
  const {
    actions,
    derived,
    state: { characters, settings, source, system, tabs },
  } = useLogmakePageState()

  const [activeTab, setActiveTab] = useState<ActiveTab>('settings')
  const hasSource = source.fileName !== null

  useEffect(() => {
    document.documentElement.dataset.theme = settings.darkMode ? 'dark' : 'light'
  }, [settings.darkMode])

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <h1 className={styles.title}>ログ整形</h1>
      </header>

      <div className={styles.pageFrame}>
        <FileUpload
          sourceFileName={source.fileName}
          system={system}
          onFileSelect={actions.handleFileSelect}
          onSystemChange={actions.handleSystemChange}
        />

        {derived.warnings.length > 0 ? (
          <section className={styles.alert}>
            <h2>確認したい項目</h2>
            <ul>
              {derived.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className={styles.pageTabs}>
          <button
            className={`${styles.pageTab} ${activeTab === 'settings' ? styles.pageTabActive : ''}`}
            type="button"
            onClick={() => setActiveTab('settings')}
          >
            出力設定
          </button>
          <button
            className={`${styles.pageTab} ${activeTab === 'growth' ? styles.pageTabActive : ''}`}
            type="button"
            disabled={!hasSource}
            onClick={() => setActiveTab('growth')}
          >
            成長技能チェック
          </button>
          <button
            className={`${styles.pageTab} ${activeTab === 'graph' ? styles.pageTabActive : ''}`}
            type="button"
            disabled={!hasSource}
            onClick={() => setActiveTab('graph')}
          >
            グラフ
          </button>
        </div>

        <div className={styles.pageTabContent}>
          {activeTab === 'settings' && (
            <>
              <BasicSettings settings={settings} onChange={actions.handleSettingChange} />
              <TabSettings
                tabs={tabs}
                onColorChange={actions.handleTabColorChange}
                onVisibilityChange={actions.handleTabVisibilityChange}
              />
              <CharacterSettings
                characters={characters}
                onColorChange={actions.handleCharacterColorChange}
                onStyleChange={actions.handleCharacterStyleChange}
                sampleButton={<DisplaySample compact />}
              />
              <DownloadActions
                canDownload={derived.canDownload}
                outputFileName={settings.logFileName}
                onDownload={actions.handleDownload}
              />
            </>
          )}
          {activeTab === 'growth' && (
            <GrowthCheck analysis={derived.analysis} tabs={tabs} />
          )}
          {activeTab === 'graph' && (
            <Graph analysis={derived.analysis} characters={characters} />
          )}
        </div>
      </div>
    </main>
  )
}

export default App

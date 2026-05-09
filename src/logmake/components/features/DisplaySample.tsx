import { useRef } from 'react'

import formStyles from '@/logmake/styles/forms.module.css'

export function DisplaySample({ compact = false }: { compact?: boolean }) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  return (
    <>
      <button
        className={compact ? formStyles.sampleCompactButton : formStyles.secondaryButton}
        type="button"
        onClick={() => dialogRef.current?.showModal()}
      >
        {compact ? '?' : '表示形式サンプル'}
      </button>

      <dialog ref={dialogRef} className={formStyles.sampleDialog}>
        <div className={formStyles.sampleDialogHeader}>
          <span>表示形式サンプル</span>
          <button
            className={formStyles.dialogCloseButton}
            type="button"
            onClick={() => dialogRef.current?.close()}
          >
            ✕
          </button>
        </div>
        <div className={formStyles.growthBox} data-testid="display-sample">
          <div className={formStyles.sampleLogEntrySpeaker}>
            <span
              className={formStyles.sampleLogSpeaker}
              style={{ color: 'rgb(30, 144, 255)' }}
            >
              キャラクタ名
            </span>
            <div className={formStyles.sampleLogMessages}>
              <p className={formStyles.sampleLogMessage}>
                <span>人物を選ぶとこんな感じで表示されます</span>
                <br />
              </p>
            </div>
          </div>

          <div className={formStyles.sampleLogEntryInfo}>
            <h4 className={formStyles.sampleLogInfoTitle}>アイテム名</h4>
            <div className={formStyles.sampleLogMessages}>
              <p className={formStyles.sampleLogInfoMessage}>
                <span>情報を選ぶとこんな感じで表示されます</span>
                <br />
              </p>
            </div>
          </div>

          <div className={formStyles.sampleLogEntryScene}>
            <h3 className={formStyles.sampleLogScene} style={{ color: 'rgb(112, 112, 112)' }}>
              場面名（KPなど）
            </h3>
            <div className={formStyles.sampleLogMessages}>
              <p className={formStyles.sampleLogMessage}>
                <span>場面を選ぶとこんな感じで表示されます</span>
                <br />
              </p>
            </div>
          </div>

          <div
            className={formStyles.sampleLogTabSection}
            style={{ borderLeft: '3px solid rgb(211, 13, 13)' }}
          >
            <div className={formStyles.sampleLogEntrySpeaker}>
              <span
                className={formStyles.sampleLogSpeaker}
                style={{ color: 'rgb(50, 150, 50)' }}
              >
                キャラクタ名
              </span>
              <div className={formStyles.sampleLogMessages}>
                <p className={formStyles.sampleLogMessage}>
                  <span>
                    メインと情報以外のタブはこんな感じ（左側のラインの色が選択できます）
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </dialog>
    </>
  )
}

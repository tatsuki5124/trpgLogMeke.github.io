import type {
  GrowthFilters,
  GrowthLabel,
  LogmakeSettings,
  TabConfig,
} from '@/logmake/types'

export const DEFAULT_NAME_COLOR = '#ffffff'
export const DEFAULT_FRAME_COLOR = '#6b8e23'
export const DEFAULT_BACK_COLOR = '#ffffff'

export const SUCCESS_HIGHLIGHT =
  'linear-gradient(transparent 70%, #7fbfff 0%)'
export const FAILURE_HIGHLIGHT =
  'linear-gradient(transparent 70%, #ff7f7f 0%)'

const TAB_COLOR_PALETTE = [
  '#8e5c5c',
  '#597da7',
  '#6e8e3d',
  '#9c6a2e',
  '#7164a9',
  '#567f83',
  '#ab5a7b',
  '#8c7a45',
]

/**
 * 「メイン」「情報」タブを含むデフォルトのタブセットを生成する。
 * ログ読み込み前の初期状態として使用する。
 *
 * @returns デフォルトタブ設定のレコード
 */
export function createBaseTabs(): Record<string, TabConfig> {
  return {
    メイン: {
      name: 'メイン',
      color: 'rgba(255,255,255,0)',
      visible: true,
    },
    情報: {
      name: '情報',
      color: 'rgba(255,255,255,0)',
      visible: true,
    },
  }
}

/**
 * デフォルトのログ整形設定を生成する。
 *
 * @param baseName - ファイル名・タイトルの初期値（省略時は 'log'）
 * @returns デフォルト設定オブジェクト
 */
export function createDefaultSettings(baseName = 'log'): LogmakeSettings {
  return {
    logFileName: baseName,
    title: baseName,
    nameColor: DEFAULT_NAME_COLOR,
    frameColor: DEFAULT_FRAME_COLOR,
    backColor: DEFAULT_BACK_COLOR,
  }
}

/**
 * 成長判定フィルタの初期値を生成する。
 * 前回の設定がある場合は各フィールドを引き継ぐ。
 * 「通常成功」「通常失敗」はデフォルトで非表示になる。
 *
 * @param labels - 対象システムで使用する成長ラベルの配列
 * @param previous - 引き継ぐ既存フィルタ設定（省略時はすべてデフォルト値）
 * @returns 成長フィルタ設定
 */
export function createGrowthFilters(
  labels: GrowthLabel[],
  previous?: GrowthFilters,
): GrowthFilters {
  const labelVisibility = Object.fromEntries(
    labels.map((label) => [
      label,
      previous?.labels[label] ??
        !['通常成功', '通常失敗'].includes(label),
    ]),
  ) as GrowthFilters['labels']

  return {
    labels: labelVisibility,
    visibility: {
      tabName: previous?.visibility.tabName ?? true,
      value: previous?.visibility.value ?? true,
      status: previous?.visibility.status ?? true,
    },
  }
}

/**
 * アップロードされたファイル名からログ名の基準文字列を取得する。
 * 「[...]」形式のプレフィックスと拡張子（.html/.htm）を除去する。
 *
 * @param name - アップロードファイルの元のファイル名
 * @returns 整形後のログ名（空文字になる場合は 'log' を返す）
 */
export function sanitizeUploadFileName(name: string): string {
  return name.replace(/\[.+\](.*)/, '$1').replace(/\.html?$/i, '') || 'log'
}

/**
 * CCFOLIA のログ内タブ識別子を表示用の日本語名に変換する。
 * 未知の識別子はそのまま返す。
 *
 * @param rawTabName - ログ内の生タブ名（例: 'main', 'info'）
 * @returns 表示用タブ名（例: 'メイン', '情報'）
 */
export function getTabDisplayName(rawTabName: string): string {
  switch (rawTabName) {
    case 'main':
      return 'メイン'
    case 'info':
      return '情報'
    case 'other':
      return '雑談'
    default:
      return rawTabName
  }
}

/**
 * 指定した名前のタブ設定を生成する。
 * 主要タブ（「メイン」「情報」）は透明色、それ以外はシード値から安定した色を割り当てる。
 *
 * @param name - タブ名
 * @returns タブ設定オブジェクト
 */
export function createTabConfig(name: string): TabConfig {
  return {
    name,
    color: isPrimaryTab(name) ? 'rgba(255,255,255,0)' : getStableTabColor(name),
    visible: true,
  }
}

/**
 * 指定したタブ名が主要タブ（「メイン」または「情報」）であるか判定する。
 *
 * @param tabName - 判定対象のタブ名
 * @returns 主要タブなら true
 */
export function isPrimaryTab(tabName: string): boolean {
  return tabName === 'メイン' || tabName === '情報'
}

/**
 * 文字列シードから TAB_COLOR_PALETTE 内のインデックスを安定的に決定する。
 * 同じ名前には常に同じ色が割り当てられる。
 *
 * @param seed - タブ名
 * @returns パレット内の色文字列
 */
function getStableTabColor(seed: string): string {
  let hash = 0
  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) % TAB_COLOR_PALETTE.length
  }
  return TAB_COLOR_PALETTE[Math.abs(hash) % TAB_COLOR_PALETTE.length]
}

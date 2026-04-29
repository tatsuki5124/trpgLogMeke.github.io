/** ゲームシステムの識別子 */
export type GameSystem = 'CoC6' | 'CoC7'

/** キャラクターを HTML に出力する際の表示スタイル */
export type CharacterStyle = 'character' | 'item' | 'scene'

/**
 * 成長判定の分類ラベル。
 * CoC6版と CoC7版では使用できるラベルのセットが異なる。
 */
export type GrowthLabel =
  | 'クリティカル'
  | 'スペシャル'
  | 'イクストリーム'
  | 'ハード'
  | 'ファンブル'
  | '故障'
  | '初期値成功'
  | '通常成功'
  | '通常失敗'

/** ダイス結果トークンの強調表示種別 */
export type DiceHighlight = 'success' | 'failure'

/**
 * ログ整形の出力設定。
 * フォームの入力値をそのまま保持する。
 */
export interface LogmakeSettings {
  logFileName: string
  title: string
  nameColor: string
  frameColor: string
  backColor: string
}

/**
 * タブの表示設定。
 * ログから自動抽出されるが、ユーザーが色・表示を変更できる。
 */
export interface TabConfig {
  name: string
  color: string
  visible: boolean
}

/**
 * キャラクターの表示設定。
 * ログから自動抽出されるが、スタイルを手動変更できる。
 */
export interface CharacterConfig {
  name: string
  color: string
  style: CharacterStyle
}

/**
 * ダイスロールの判定対象（技能・能力値など）。
 * 複合コマンドの場合は DiceEvent.targets に複数格納される。
 */
export interface DiceEventTarget {
  name: string
  judge: string | null
  outcomeText?: string
  target?: number
}

/**
 * ひとつのダイスロールイベントの解析結果。
 * チャットログの1フラグメントから抽出される。
 */
export interface DiceEvent {
  rawText: string
  command: string
  outcomeText: string
  primaryRoll: number | null
  rolls: number[]
  targets: DiceEventTarget[]
  status: boolean
  highlight?: DiceHighlight
  meta?: Record<string, unknown>
}

/**
 * コンテンツの最小単位。
 * テキストフラグメントひとつを表し、ダイス結果を含む場合がある。
 */
export interface ContentToken {
  content: string
  highlight?: DiceHighlight
  dice?: DiceEvent
}

/** 改行（br タグ）で区切られたコンテンツのひとまとまり */
export interface ContentParagraph {
  tokens: ContentToken[]
}

/**
 * パース済みの発言エントリ1件。
 * タブ・キャラクター・発言内容を保持する。
 */
export interface ParsedLogEntry {
  id: string
  tabName: string
  charName: string
  charColor: string
  sourceHtml: string
  paragraphs: ContentParagraph[]
}

/**
 * ログ全体のパース結果。
 * entries・tabs・characters・warnings をまとめて保持する。
 */
export interface ParsedLog {
  entries: ParsedLogEntry[]
  tabs: Record<string, TabConfig>
  characters: Record<string, CharacterConfig>
  warnings: string[]
}

/** 成長判定の1件分のレコード */
export interface DiceRecord {
  charName: string
  tabName: string
  ginou: string
  value: number
  status: boolean
  label: GrowthLabel
}

/**
 * ログ全体の成長判定分析結果。
 * キャラクター別・ラベル別に DiceRecord を集約する。
 */
export interface GrowthAnalysis {
  labels: GrowthLabel[]
  byCharacter: Record<string, Partial<Record<GrowthLabel, DiceRecord[]>>>
  records: DiceRecord[]
  warnings: string[]
}

/** 成長サマリー各列の表示切り替え状態 */
export interface ToggleVisibility {
  tabName: boolean
  value: boolean
  status: boolean
}

/**
 * 成長サマリーの表示フィルタ条件。
 * ラベルの ON/OFF と列の表示切り替えを管理する。
 */
export interface GrowthFilters {
  labels: Record<GrowthLabel, boolean>
  visibility: ToggleVisibility
}

/** 出力 HTML におけるひとりのキャラクターの発言ブロック */
export interface OutputSpeakerEntry {
  charName: string
  color: string
  style: CharacterStyle
  paragraphs: ContentParagraph[]
}

/**
 * 出力 HTML におけるひとつのタブセクション。
 * entries に発言ブロックの配列を持つ。
 */
export interface OutputSection {
  tabName: string
  tabColor: string
  /** 出力 HTML 内のタブ表示切替に使う安全な CSS class */
  tabVisibilityClass: string
  entries: OutputSpeakerEntry[]
}

/** タブ表示切り替えチェックボックスの情報 */
export interface OutputToggle {
  name: string
  color: string
  /** label/input の紐付けに使う安全な DOM id */
  inputId: string
  /** 表示切替対象を探すための安全な CSS class */
  tabVisibilityClass: string
}

/**
 * HTML 出力全体のデータモデル。
 * buildOutputHtml に渡す中間表現。
 */
export interface OutputModel {
  sections: OutputSection[]
  toggles: OutputToggle[]
}

/** buildOutputModel に渡すオプション */
export interface BuildOutputOptions {
  tabs: Record<string, TabConfig>
  characters: Record<string, CharacterConfig>
}

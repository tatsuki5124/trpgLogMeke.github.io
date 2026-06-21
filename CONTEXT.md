# ドメイン用語集（ユビキタス言語）

TRPG Log Maker で使う型名・値名の正規定義。
コード上の命名はこの用語集に従う。

---

## 出力パイプライン

| 型名 | 説明 |
|---|---|
| `OutputEntry` | 出力 HTML における 1 キャラクター分の発言ブロック。style が scene でも item でも統一的に扱う |
| `OutputTabSection` | 出力 HTML における 1 タブ分のセクション。`OutputEntry` の配列を持つ |
| `OutputToggle` | タブ表示切り替えチェックボックスの情報 |
| `OutputModel` | 出力 HTML 全体のデータモデル。`buildOutputHtml` に渡す中間表現 |
| `BuildOutputOptions` | `buildOutputModel` に渡すオプション（tabs・characters） |

## ログパース

| 型名 | 説明 |
|---|---|
| `ParsedLogEntry` | パース済みの発言 1 件。タブ・キャラクター・発言内容を保持 |
| `ParsedLog` | ログ全体のパース結果。entries・tabs・characters・warnings を集約 |
| `ContentToken` | コンテンツの最小単位。テキストフラグメント 1 つを表す |
| `ContentParagraph` | 改行（br タグ）で区切られたコンテンツのひとまとまり |

## ダイス判定

| 型名 | 説明 |
|---|---|
| `DiceEvent` | 1 ダイスロールイベントの解析結果。チャットログの 1 フラグメントから抽出 |
| `JudgmentTarget` | ダイスロールの判定対象（技能・能力値など）。複合コマンドでは複数存在 |
| `DiceRollRecord` | 採用出目 1 件分のレコード。グラフ・成長判定で共有 |
| `DiceRollAnalysis` | ログ全体の採用出目分析結果 |
| `DiceHighlight` | ダイス結果トークンの強調表示種別（`success` / `failure`） |

## 成長判定

| 型名 | 説明 |
|---|---|
| `GrowthRecord` | 成長判定 1 件分の表示レコード |
| `GrowthAnalysis` | ログ全体の成長判定分析結果。キャラクター別・ラベル別に集約 |
| `GrowthLabel` | 成長判定の分類ラベル（クリティカル・スペシャル等） |
| `GrowthTargetKind` | 成長チェック上の判定対象種別 |

### GrowthTargetKind の値

| 値 | 意味 |
|---|---|
| `listedSkill` | デフォルトリストに掲載されている技能 |
| `rawD100` | 対象不明の生 D100 ロール |
| `unlistedSkill` | リスト外の自由入力技能 |
| `resistance` | 抵抗ロール |
| `combination` | 複合判定 |

## キャラクター・表示

| 型名 | 説明 |
|---|---|
| `CharacterStyle` | キャラクターの出力表示スタイル（`character` / `item` / `scene`） |
| `CharacterConfig` | キャラクターの表示設定。ログから自動抽出、スタイル手動変更可 |
| `TabConfig` | タブの表示設定。ログから自動抽出、色・表示を変更可 |
| `LogmakeSettings` | ログ整形の出力設定（タイトル・色・横書き/縦書き等） |

## ゲームシステム抽象層

| 型名 | 説明 |
|---|---|
| `GameSystem` | ゲームシステムの識別子（`CoC6` / `CoC7`） |
| `LogmakeSystem` | ゲームシステムの解析・成長判定機能を束ねるインターフェース |
| `GrowthCapability` | システム固有の成長判定機能（ラベル・技能値・分類） |
| `GrowthClassification` | `classifyEvent` の分類結果 |

## UI 状態

| 型名 | 説明 |
|---|---|
| `ToggleVisibility` | 成長サマリー各列の表示切り替え状態 |
| `GrowthFilters` | 成長サマリーの表示フィルタ条件 |

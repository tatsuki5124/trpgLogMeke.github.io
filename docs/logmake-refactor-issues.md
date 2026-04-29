# Logmake Refactor Roadmap

作成日: 2026-04-26  
対象ブランチ: `feature/react-migration`

## 目的

React 移行版の完了済み項目、判断保留項目、今後の改善候補を 1 か所にまとめる。

## 完了済み

| 項目                  | 内容                                                                                                        |
| --------------------- | ----------------------------------------------------------------------------------------------------------- |
| React 専用入口        | `logmake/index.html` と `src/logmake/main.tsx` を追加し、logmake ページを独立させた。                       |
| Pure Function 化      | `parseLogHtml`, `analyzeGrowth`, `buildOutputModel`, `buildOutputHtml` を `src/logmake/lib/` に分離した。   |
| UI 分割               | `FileUpload`, `GrowthCheck`, `DisplaySample`, `Graph`, `OutputSettings` などへ分けた。                      |
| OutputModel 化        | プレビュー用ではなく、出力 HTML 生成用の中間モデルとして整理した。                                          |
| 表示形式サンプル      | 整形結果プレビューを廃止し、旧画面どおりの静的サンプルへ戻した。                                            |
| box5 幅修正           | `.page` の最大幅制限を外し、旧実装の余白感に寄せた。                                                        |
| 成長ダイス切替バグ    | event の値を state updater 外で退避し、表示切替時のクラッシュを防いだ。                                     |
| downloadFile 切り出し | Blob ダウンロードの DOM 操作を `lib/utils/downloadFile.ts` に分離した。                                     |
| テスト追加            | unit test と Playwright E2E で解析、出力、表示切替、ダウンロードを確認するようにした。                      |
| DOMParser 化          | fixture を追加し、`parseLogHtml()` を `<p>` と直下 `span` を読む DOMParser ベースへ移行した。               |
| BCDice fixture 拡充   | おみくじ、繰り返しダイス、初期値成功、クリティカル、ファンブル、`RESB`, `CBR`, 故障判定を追加した。         |
| 成長判定拡張          | `CBR` / `CBRB` と故障判定も、技能名を取れる場合は成長判定欄へ出すようにした。                               |
| 初期値 JSON 辞書化    | 初期値 JSON 自体を技能名と初期値の辞書にし、技能名と判定値のペアで判定するようにした。                      |
| system adapter 化     | system ごとの公開窓口、ダイス抽出、成長判定を分け、初期技能値も adapter から取得するようにした。            |
| OutputModel 安全化    | タブ表示名と出力 HTML 内の `id` / `class` を分け、特殊文字を含むタブ名でも表示切替が壊れないようにした。    |
| 純粋関数テスト補強    | `buildOutputModel` と `buildGrowthSummaryText` の直接テストを追加し、出力境界と成長サマリー整形を固定した。 |
| Zustand 削除          | 実際に import されていなかったため `dependencies` から削除。状態管理は `useLogmakePageState` のみ。           |
| CSS カラー検証        | `buildOutputHtml` の設定色とタブ色を `sanitizeCssColor()` で検証し、不正値を `#ffffff` にフォールバック。    |

## 保留した判断

### Zustand 導入

削除済み（`dependencies` から除去）。

再導入するなら、次のどれかが必要になった時点で検討する:

- 設定の localStorage 永続化
- 複数ページ間での状態共有

それまでは `useLogmakePageState` カスタムフックで十分。

### visibleTabs のリフトアップ

現時点では不要。

理由:

- 成長判定欄の表示フィルタは `GrowthCheck` だけで使う。
- 出力 HTML のタブ表示設定とは責務が違う。
- localStorage 永続化が必要になるまでは、feature-local state のままが読みやすい。

## 次に優先したい改善

### 1. 実ログ由来 fixture の継続追加

`parseLogHtml()` は DOMParser ベースへ移行済み。BCDice の代表的な複合ケースも追加済み。今後 CCFOLIA 側の出力差分や実ログ由来の崩れを見つけたら、まず fixture を増やしてから解析処理を調整する。

追加候補:

- さらに長い通常ログ
- `<span>` 内に装飾タグが多いログ
- `RESB`, `CBR`, 故障判定以外の特殊コマンド
- 技能名 tail に HTML タグや全角スペースが混じる実ログ
- CoC 6版 / 7版それぞれの実ログ由来パターン

### 2. 新 system 追加時の adapter 境界維持

本文 token のダイス情報は `DiceEvent` に寄せ、CoC の D100 成長判定は system adapter の `growth` に分離済み。これは新しい未実装タスクではなく、エモクロアなどを足すときに維持する境界として扱う。

エモクロア対応へ進むときは、次の分離を維持する。

```ts
ParsedLog
DiceEvent
CoCGrowthAnalysis
EmokloreAnalysis
```

狙い:

- parser はログ本文と BCDice の結果行を読むだけにする。
- 成長判定は system ごとの growth に閉じる。
- エモクロア固有の判定を追加しても、出力 HTML 生成や CoC 成長判定を壊しにくくする。
- system 追加時は、UI や `lib/` に system 分岐を増やす前に adapter 側の責務で表現できないか確認する。

### 3. 縦書き HTML / PDF 出力の設計

縦書きと PDF は、parser 側ではなく `OutputModel` 以降の renderer/exporter として追加する。

優先順:

1. 横書き HTML と同じ `OutputModel` から縦書き HTML を生成できるか確認する。
2. PDF はブラウザ印刷または HTML からの変換として扱い、ログ解析ロジックには混ぜない。
3. 表示崩れを避けるため、まず短い fixture で横書き/縦書き/PDF の出力差分を確認する。

### 4. グラフ機能の追加検討

現状は成長判定対象の出目分布を表示するところまで。必要になったら、表示切替や画像保存を検討する。

ただしログ整形の主目的は HTML ダウンロードなので、解析の安定化や出力品質よりは低優先度。

### 5. ID ベース構造

現在は tab 名や character 名を `Record` の key にしている。

同名キャラクター、表示名変更、順序管理を安全に扱うなら、将来的に次の形へ寄せる。

```ts
tabsById + tabOrder
charactersById + characterOrder
entries は tabId / characterId を参照
```

ただし今は名前ベースの方が読みやすく、実害も出ていないため低優先度。

### 6. 設定の保存

色や表示形式を毎回設定し直すのが負担になったら、localStorage 保存を検討する。基本的には不要の認識。

この段階で Zustand の `persist` を使うか、単純な custom hook にするかを比較する。

## 直近の確認コマンド

軽量確認:

```bash
pnpm test:unit
pnpm lint
```

最終確認:

```bash
pnpm build
pnpm test:e2e
git diff --check
```

出力 HTML 周りを触った場合は、unit test で `buildOutputModel` / `buildOutputHtml` の内容を確認し、必要に応じて E2E でもダウンロード内容を確認する。

## main への PR 前チェック

- `feature/react-migration` 上で unit / e2e / build が通る。
- 旧 `index_logmake.html` と見た目や操作順の差分を確認する。
- GitHub Pages の公開元が `main` であることを再確認する。
- `main` への PR は、動作確認が終わるまで作らない。

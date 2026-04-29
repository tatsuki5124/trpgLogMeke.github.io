# TRPG Log Maker

CCFOLIA の HTML ログを解析・整形して配布用 HTML を生成するツール。CoC 6th/7th 対応。

---

## 技術スタック

- **React** 18.3.1 / **TypeScript** 5.6.3 / **Vite** 5.4.11
- **Chart.js** 4.4.7 + react-chartjs-2 / 状態管理: カスタムフック（Zustand 不使用）
- **テスト**: Vitest（ユニット）/ Playwright（E2E）/ **Node.js** 22 LTS / **pnpm** 10

---

## ディレクトリ構造

```
src/
├── main.tsx / App.tsx           # ランディングページ
└── logmake/                     # ログ整形ツール本体
    ├── types/                   # 全体共通の型定義
    ├── systems/                 # ゲームシステム抽象層
    │   ├── types.ts             # LogmakeSystem インターフェース
    │   ├── index.ts / coc6.ts / coc7.ts
    │   └── coc/                 # CoC 共通ロジック（ファクトリ）
    │       └── data/            # defaultSkillValues6th/7th.json
    ├── lib/                     # ビジネスロジック（React 非依存）
    │   ├── parseLogHtml.ts      # ※DOMParser 依存のため例外
    │   ├── analyzeGrowth.ts / buildOutputModel.ts
    │   ├── buildOutputHtml.ts
    │   ├── buildGrowthSummaryText.ts
    │   ├── htmlUtils.ts         # escapeText / sanitizeCssColor
    │   └── utils/downloadFile.ts
    ├── hooks/useLogmakePageState.ts  # 状態管理の中心
    ├── components/features/     # UI コンポーネント
    └── test/                    # ユニットテスト・フィクスチャ
logmake/index.html               # logmake エントリ HTML
legacy/                          # 移行前 Vue 版（参照用）
```

---

## コマンド

```bash
pnpm dev          # 開発サーバー
pnpm build        # 本番ビルド (tsc + vite build)
pnpm test:unit    # Vitest ユニットテスト
pnpm test:e2e     # Playwright E2E テスト
pnpm lint         # ESLint
```

---

## コミット規約

形式: `<type>: <subject>` / type: `feat` / `fix` / `refactor` / `docs` / `test` / `chore`

**テストファースト原則**（バグ修正・リファクタリング時）:
1. 失敗するテストを先に書く
2. テストが通るように実装を変更する
3. テスト＋実装を 1 コミットにまとめる（`fix:` だけ・`test:` だけに分けない）

例外: `docs:` と `chore:` はテスト不要。

---

## ブランチ・設計原則

- 開発は `feature/react-migration` / `main` へのマージは動作確認済みのみ
- `lib/` はフレームワーク非依存（`parseLogHtml` のみ DOMParser 依存）
- ゲームシステムは `LogmakeSystem` インターフェース経由で抽象化（`systems/types.ts`）
- TypeScript strict mode・`any` 禁止

## テスト戦略（3層）

| 層   | ツール              | 対象                            | 場所                             |
| ---- | ------------------- | ------------------------------- | -------------------------------- |
| BHV  | playwright-bdd      | E2E ユーザーシナリオ（Gherkin） | specs/features/                  |
| INV  | fast-check + vitest | 純粋関数の不変条件              | src/logmake/test/properties/     |
| ERR  | AGENTS.md 文書化    | 意図的な挙動・実装上の注意点    | このファイル（既知の注意点欄）   |

新機能は `.feature` を先に書き、`pnpm bddgen` で失敗確認してから実装する。
`specs/features/` が正規の仕様ドキュメント。`tests/bdd/steps/` がテスト実装。

```bash
pnpm bddgen          # .feature からテストコード生成
pnpm test:bdd        # BDD シナリオ実行
pnpm test:unit       # ユニットテスト + プロパティテスト
pnpm test:all        # 全テスト
```

---

## 既知の設計上の注意点

- **`renderToken` の `token.content` はエスケープしない（意図的）**
  CCFOLIA の innerHTML をそのまま出力 HTML に通している。
  `escapeText()` を適用すると CCFOLIA のインライン書式（`<b>` 等）が壊れる。
  将来「セキュリティ修正」として誤ってエスケープを追加しないこと。

- **`parseLogHtml` はブラウザ専用**（`DOMParser` 依存）
  Node.js 環境でテストする場合は jsdom が必要（vitest.config の `environment: 'jsdom'` で対応済み）。

- **`escapeText` は呼び出し回数だけエスケープを適用する（冪等でない）**
  生ログテキストのみに適用すること。すでにエスケープ済みの文字列への重複適用は呼び出し側が避ける。
  `escapeText` は `src/logmake/lib/htmlUtils.ts` に独立モジュールとして配置されている。

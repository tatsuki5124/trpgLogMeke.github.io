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
    │   ├── buildOutputHtml.ts   # sanitizeCssColor() で色値を検証
    │   ├── buildGrowthSummaryText.ts
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

## 既知の設計上の注意点

- **`renderToken` の `token.content` はエスケープしない（意図的）**
  CCFOLIA の innerHTML をそのまま出力 HTML に通している。
  `escapeText()` を適用すると CCFOLIA のインライン書式（`<b>` 等）が壊れる。
  将来「セキュリティ修正」として誤ってエスケープを追加しないこと。

- **`parseLogHtml` はブラウザ専用**（`DOMParser` 依存）
  Node.js 環境でテストする場合は jsdom が必要（vitest.config の `environment: 'jsdom'` で対応済み）。

# TRPG Log Maker

Vue.js (CDN版) で実装された TRPG ログ整形ツールを Vite + React + TypeScript へ移行するプロジェクト。
CoC 6th/7th のログ解析・成長判定・グラフ表示機能を対象とする。

開発方針・コミット規約・テストファースト原則 → **AGENTS.md** を参照。

---

## 技術スタック

- **React** 18.3.1 / **TypeScript** 5.6.3 / **Vite** 5.4.11
- **Chart.js** 4.4.7 + react-chartjs-2（グラフ）
- **状態管理**: カスタムフック（Zustand 不使用）
- **テスト**: Vitest（ユニット）/ Playwright（E2E）
- **Node.js** 22 LTS / **pnpm** 10

---

## ディレクトリ構造

```
trpgLogMeke.github.io/
├── src/
│   ├── main.tsx / App.tsx       # ランディングページ
│   └── logmake/                 # ログ整形ツール本体
│       ├── main.tsx / App.tsx
│       ├── types/               # 全体共通の型定義
│       ├── systems/             # ゲームシステム抽象層
│       │   ├── types.ts         # LogmakeSystem インターフェース
│       │   ├── index.ts         # システム一覧・getLogmakeSystem
│       │   ├── coc6.ts / coc7.ts
│       │   └── coc/             # CoC 共通ロジック（ファクトリ）
│       │       └── data/        # defaultSkillValues6th/7th.json
│       ├── lib/                 # ビジネスロジック（React 非依存）
│       │   ├── parseLogHtml.ts
│       │   ├── analyzeGrowth.ts
│       │   ├── buildOutputModel.ts
│       │   ├── buildOutputHtml.ts
│       │   ├── buildGrowthSummaryText.ts
│       │   └── utils/downloadFile.ts
│       ├── hooks/               # React カスタムフック
│       │   └── useLogmakePageState.ts  # 状態管理の中心
│       ├── components/features/ # UI コンポーネント
│       └── test/                # ユニットテスト・フィクスチャ
├── logmake/index.html           # logmake エントリ HTML
├── legacy/                      # 移行前 Vue 版（参照用）
├── docs/                        # 設計ドキュメント
├── AGENTS.md                    # 開発ルール（AI・人間共通）
└── package.json / pnpm-lock.yaml
```

---

## コマンド

```bash
pnpm dev          # 開発サーバー起動
pnpm build        # 本番ビルド (tsc + vite build)
pnpm test:unit    # Vitest ユニットテスト
pnpm test:e2e     # Playwright E2E テスト
pnpm lint         # ESLint
```

---

## 重要な設計決定

- `lib/` はフレームワーク非依存のピュア関数のみ（`parseLogHtml` は DOMParser 依存のため例外）
- ゲームシステムは `LogmakeSystem` インターフェース経由で差し替え可能（systems/types.ts）
- 出力 HTML はクライアントサイドのみで生成・ダウンロード（サーバー送信なし）
- CSS カラー値はユーザー入力を `sanitizeCssColor()` で検証してから埋め込む

---

## ブランチ

```
main                    本番（GitHub Pages 自動デプロイ）
feature/react-migration 開発ブランチ（マージ先）
```

`main` へのマージは動作確認済みのものだけ。

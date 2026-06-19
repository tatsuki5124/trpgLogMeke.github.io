# CONTEXT — TRPG Log Maker

## なぜこのプロジェクトが存在するか

CCFOLIA（ココフォリア）のセッションログを整形して配布用 HTML を生成するツール。

既存の無料ログ整形ツールでは機能が足りず、自分用に開発を始めた。
当初は個人で卓のログを整形していたが、依頼が増えて手間になったため公開に至った。
React/TypeScript の学習プロジェクトとしての側面もある。

## プロダクトスコープ

### サイト全体

ランディングページ（`src/App.tsx`）は TRPG 関連ツールのポータルとして機能する。
現在は logmake（ログ整形ツール）がメインだが、NPC 作成ツールなど他のツールも順次追加予定。

### logmake（ログ整形ツール）

| 項目             | 内容                                                    |
| ---------------- | ------------------------------------------------------- |
| 入力             | CCFOLIA が出力する HTML ログファイル                    |
| 対応システム     | CoC 6th / CoC 7th（エモクロア対応予定）                 |
| 出力             | 整形済み HTML（ダウンロード配布用）                     |
| 付加機能         | ダイスロール分析、技能成長チェック、統計グラフ          |

## 技術的な前提・制約

- **完全静的サイト**: バックエンドなし。すべての処理はブラウザ側で完結する。ログやユーザーデータをサーバーに送信しないことがセキュリティ上の要件。
- **CCFOLIA 専用**: 他の VTT（ユドナリウム等）のログ形式には対応しない。
- **ブラウザサポート**: モダンブラウザ全般（Chrome / Firefox / Safari / Edge）。モバイル対応も対象。
- **開発体制**: 個人開発（AI との協業）。OSS 化やコントリビューター募集の予定はない。
- **legacy/ ディレクトリ**: 旧 Vue 版の参照用コピー。React 版が安定したら削除予定。

## デプロイ

- **ホスティング**: GitHub Pages のみ
- **URL**: `https://tatsuki5124.github.io/trpgLogMeke.github.io/`
- **ビルド**: Vite で静的ファイルを生成し、GitHub Pages にデプロイ

## 技術スタック

| カテゴリ       | 技術                                         |
| -------------- | -------------------------------------------- |
| フレームワーク | React 18.3.1 + TypeScript 5.6.3              |
| ビルド         | Vite 5.4.11                                  |
| グラフ         | Chart.js 4.4.7 + react-chartjs-2             |
| 状態管理       | カスタムフック（Zustand 不使用 → ADR-002）   |
| テスト         | Vitest / Playwright / fast-check             |
| ランタイム     | Node.js 22 LTS / pnpm 10                     |

## ドキュメント構成

```
CLAUDE.md          → AI エージェント向けエントリーポイント（AGENTS.md を参照）
AGENTS.md          → 開発ルール・コマンド・テスト戦略・コミット規約
CONTEXT.md         → このファイル。プロダクトの背景と技術的前提
docs/
├── README.md                    → ドキュメント索引
├── adr/                         → アーキテクチャ判断記録（ADR）
├── logmake-architecture.md      → logmake の設計詳細
├── logmake-state-management.md  → 状態管理の設計
├── logmake-refactor-issues.md   → リファクタリング進捗・ロードマップ
├── logmake-output-comparison/   → 出力 HTML の比較検討
└── references/                  → BCDice コマンド仕様等の参照資料
```

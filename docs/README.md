# Docs Index

プロジェクトの設計資料・技術ドキュメント・判断記録。

プロダクトの背景と前提は [`CONTEXT.md`](../CONTEXT.md) を参照。
開発ルール・コマンド・テスト戦略は [`AGENTS.md`](../AGENTS.md) を参照。

## ADR（アーキテクチャ判断記録）

主要な技術判断の記録。→ [`adr/`](./adr/)

| ADR | タイトル | 状態 |
| --- | -------- | ---- |
| [001](./adr/001-react-migration.md) | Vue から React への移行 | 採用 |
| [002](./adr/002-no-zustand.md) | 状態管理に Zustand を採用しない | 採用 |
| [003](./adr/003-game-system-abstraction.md) | ゲームシステムの抽象化 | 採用 |
| [004](./adr/004-static-site-only.md) | 完全静的サイト（バックエンドなし） | 採用 |
| [005](./adr/005-output-model-separation.md) | OutputModel によるダウンロード HTML 生成 | 採用 |
| [006](./adr/006-no-escape-token-content.md) | トークンコンテンツの非エスケープ | 採用 |

## 技術ドキュメント

| ファイル                         | 内容                                                               |
| -------------------------------- | ------------------------------------------------------------------ |
| `logmake-architecture.md`        | フォルダ責務、データフロー、コンポーネント構成、UI 方針。          |
| `logmake-state-management.md`    | state owner、派生値、feature-local state の設計。                  |
| `logmake-refactor-issues.md`     | 完了済み項目、保留判断、今後の改善ロードマップ。                   |
| `logmake-output-comparison/`     | 出力 HTML のレイアウト比較検討。                                   |

## 参照資料

| ファイル                          | 内容                                                               |
| --------------------------------- | ------------------------------------------------------------------ |
| `references/bcdice-systems.md`    | CoC 6版/7版、エモクロア、繰り返しコマンドの BCDice 参照メモ。      |

ユーザー向け画面には学習用説明を出さず、設計理由はこの `docs/` に残す。

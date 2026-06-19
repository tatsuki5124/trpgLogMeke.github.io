# ADR（Architecture Decision Records）

プロジェクトの主要な技術判断を記録する。

## フォーマット

各 ADR は以下の構造に従う:

- **状態**: 採用 / 保留 / 廃止
- **判断**: 何を決めたか
- **理由**: なぜその判断に至ったか
- **代替案**: 検討したが採用しなかった選択肢

## 一覧

| ADR | タイトル | 状態 |
| --- | -------- | ---- |
| [001](./001-react-migration.md) | Vue から React への移行 | 採用 |
| [002](./002-no-zustand.md) | 状態管理に Zustand を採用しない | 採用 |
| [003](./003-game-system-abstraction.md) | ゲームシステムの抽象化 | 採用 |
| [004](./004-static-site-only.md) | 完全静的サイト（バックエンドなし） | 採用 |
| [005](./005-output-model-separation.md) | OutputModel によるダウンロード HTML 生成 | 採用 |
| [006](./006-no-escape-token-content.md) | トークンコンテンツの非エスケープ | 採用 |

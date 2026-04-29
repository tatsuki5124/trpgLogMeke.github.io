# TRPG Log Maker — プロダクト目的

## 目的

CCFOLIA のセッションログ（HTML）を受け取り、参加者に配布しやすい整形済み HTML を生成する。

## スコープ

- **対象ツール**: ログ整形ツール（logmake）。将来 NPC ツール等を追加予定。
- **対応システム**: Call of Cthulhu 6th / 7th edition
- **入力形式**: CCFOLIA が出力する HTML ログファイル
- **出力形式**: タブ切り替え・成長判定表示機能付き自己完結型 HTML

## スコープ外

- CCFOLIA 以外のログ形式のパース
- ログの保存・共有機能（クライアントサイドのみ）
- CoC 以外のゲームシステム（現時点）

## 機能領域（features/logmake/）

| ファイル | ユーザー価値 |
|---|---|
| `distribute-session-log.feature` | ログを整形して参加者に配布できる |
| `review-growth-results.feature` | 成長判定の結果をログから確認できる |
| `coc7-difficulty.feature` | CoC7 のハード/イクストリーム成功をログから確認できる |

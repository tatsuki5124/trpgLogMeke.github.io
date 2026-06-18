---
name: gate-criteria
description: TRPG Log Maker のコード品質基準とタスク完了条件の権威ある参照ドキュメント。Gate-Creator がタスク固有の基準を導出するとき、Reviewer がコードを確認するときに参照する。
---

# Gate Criteria — TRPG Log Maker

プロジェクト品質標準の権威ある参照元。Gate-Creator はこのドキュメントを読み、タスク固有の基準を導出する。

## アーキテクチャ制約

| ルール | 検証方法 |
|--------|----------|
| `lib/` はフレームワーク非依存 | `grep -r "from 'react'" src/logmake/lib/` が空であること |
| ゲームシステムは `LogmakeSystem` 経由 | 新システムは `systems/types.ts` のインターフェースを実装すること |
| `DOMParser` は `parseLogHtml` のみ許可 | `lib/` 内で `DOMParser` を使うのはこのファイルだけ |

## TypeScript 制約

| ルール | 検証方法 |
|--------|----------|
| `any` 型禁止 | `grep -rn ': any' src/logmake/` が空であること |
| strict mode 維持 | `tsconfig.json` の `"strict": true` が変更されていないこと |
| 型は `types/` に定義 | 複合型をコンポーネント内にインライン定義しない |

## 意図的な挙動（修正してはいけない）

| 挙動 | 理由 |
|------|------|
| `renderToken` は `token.content` をエスケープしない | CCFOLIA のインライン HTML（`<b>` 等）を出力 HTML に通すため |
| `escapeText` は冪等でない | 生ログテキストにのみ適用し、二重呼び出しは呼び出し側が防ぐ |

## テストファースト要件

| トリガー | 要件 |
|----------|------|
| バグ修正 | 実装前に失敗するテストを書く |
| 新機能 | `specs/features/` に `.feature` ファイルを先に書く |
| リファクタリング | 既存テストがそのまま通ること |

## 免除

`docs:` および `chore:` タイプのコミットはテストファースト要件が免除される。

## コミット形式

`<type>: <subject>` — type: `feat` / `fix` / `refactor` / `docs` / `test` / `chore`

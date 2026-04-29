# TRPG Log Maker

CCFOLIA の HTML ログを解析・整形して配布用 HTML を生成するツール。CoC 6th/7th 対応。
スタック・ディレクトリ構造は CLAUDE.md を参照。

---

## コミット規約

形式: `<type>: <subject>`

type: `feat` / `fix` / `refactor` / `docs` / `test` / `chore`

**テストファースト原則**（バグ修正・リファクタリング時）:
1. 失敗するテストを先に書く
2. テストが通るように実装を変更する
3. テスト＋実装を 1 コミットにまとめる（`fix:` だけ・`test:` だけに分けない）

例外: `docs:` と `chore:` はテスト不要。

---

## ブランチ

- 開発は `feature/react-migration` で実施
- `main` へのマージは動作確認済みのみ（GitHub Pages 自動デプロイ）

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

## 設計原則

- `src/logmake/lib/` はフレームワーク非依存のピュア関数（`parseLogHtml` のみ DOMParser 依存）
- ゲームシステムは `LogmakeSystem` インターフェース経由で抽象化（`systems/types.ts`）
- 出力 HTML に埋め込む CSS カラー値は `sanitizeCssColor()` で検証してから使う
- 状態管理は `useLogmakePageState` カスタムフックに集約（Zustand 不使用）
- TypeScript strict mode・`any` 禁止

# TRPG Log Maker - React Migration Project

## プロジェクト概要

### 目的

Vue.js (CDN版) で実装された TRPGログ整形ツール (`index_logmake.html`) を、Vite + React + TypeScript の環境に移行し、保守性・拡張性を向上させる。

### 対象ファイル

- **移行対象**: `index_logmake.html` (901行)
  - CoC 6th/7th 版対応
  - ログ解析・成長判定・グラフ表示機能
  - エラーハンドリング機能
- **移行対象外**: キャラクターシート関連ツール（別途対応予定）

---

## 技術スタック

### フロントエンド

- **React**: 18.3.1
- **TypeScript**: 5.6.3
- **Vite**: 5.4.11（ビルドツール）
- **Chart.js**: 4.4.7 + react-chartjs-2（グラフ表示）
- **状態管理**: カスタムフック（Zustand は未使用・削除済み）

### 開発環境

- **Node.js**: 22.21.1 (Homebrew経由)
- **npm**: 10.9.4
- **Git**: ブランチベースワークフロー

### デプロイ

- **GitHub Pages**: `main` ブランチから自動デプロイ
- **URL**: https://tastuki1.github.io/trpgLogMeke.github.io/

---

## ディレクトリ構造

```
trpgLogMeke.github.io/
├── .github/workflows/       # GitHub Actions設定
│   └── deploy.yml
├── .gitignore               # Git追跡除外設定
├── CLAUDE.md                # このファイル（AI開発補助用）
├── README.md                # プロジェクト説明（ユーザー向け）
├── package.json             # 依存関係定義
├── vite.config.ts           # Vite設定
├── tsconfig.json            # TypeScript設定
├── index.html               # エントリーポイント
│
├── public/                  # 静的ファイル（ビルド時にコピー）
│   ├── defaultDice6th.json
│   └── defaultDice7th.json
│
├── src/                     # ソースコード
│   ├── main.tsx             # Reactエントリーポイント
│   ├── App.tsx              # ルートコンポーネント
│   │
│   ├── components/          # UIコンポーネント
│   │   ├── common/          # 汎用UI (Button, Input等)
│   │   ├── layout/          # レイアウト
│   │   └── features/        # 機能別コンポーネント
│   │       ├── FileUploader/
│   │       ├── GrowthCheck/
│   │       ├── Graph/
│   │       ├── Settings/
│   │       ├── Preview/
│   │       └── Download/
│   │
│   ├── hooks/               # カスタムフック
│   │   ├── useFileReader.ts
│   │   ├── useLogParser.ts
│   │   └── useClipboard.ts
│   │
│   ├── lib/                 # ビジネスロジック（フレームワーク非依存）
│   │   ├── parsers/         # ログ解析ロジック
│   │   │   ├── logParser.ts
│   │   │   ├── diceAnalyzer.ts
│   │   │   └── regexPatterns.ts
│   │   ├── generators/      # テンプレート生成ロジック
│   │   │   ├── templateGenerator.ts
│   │   │   ├── contentGenerator.ts
│   │   │   └── viewCheckGenerator.ts
│   │   ├── utils/           # ユーティリティ関数
│   │   └── constants/       # 定数定義
│   │
│   ├── store/               # Zustand状態管理
│   │   ├── logStore.ts
│   │   └── slices/
│   │
│   └── types/               # TypeScript型定義
│       ├── dice.ts
│       ├── character.ts
│       ├── tab.ts
│       └── log.ts
│
├── docs/                    # 設計ドキュメント（追跡対象）
│   ├── architecture.md
│   ├── components.md
│   └── data-flow.md
│
├── knowledge/               # 学習ノート（追跡対象外）
│   ├── git.md
│   ├── React.md
│   └── Vite.md
│
└── legacy/                  # 旧実装（参照用）
    ├── index_new.html
    ├── index.html
    ├── index_makeGraph.html
    └── template.html
```

---

## 開発方針

### 1. 学習重視のアプローチ

このプロジェクトは単なるリファクタリングではなく、以下の学習目標を含む：

#### Git操作の習得

- ブランチ戦略の理解（feature/main分離）
- リモート/ローカルブランチの関係
- マージ、コンフリクト解決
- SVNとの違いの理解

#### モダンWeb開発の理解

- ビルドツール（Vite）の役割
- npm/パッケージ管理の仕組み
- TypeScriptによる型安全性
- 状態管理ライブラリ（Zustand）

#### React/TypeScript開発

- Hooksの使い方
- コンポーネント設計
- TypeScript型定義の作成
- テスタブルなコード構造

### 2. コミット方針

**テストファースト原則**: バグ修正・リファクタリングはテストと実装を同一コミットに含める。
詳細は AGENTS.md の「テストファースト原則」セクションを参照。

#### コミットメッセージ規約

```
<type>: <subject>

<body>

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Type一覧**:

- `feat`: 新機能追加
- `fix`: バグ修正
- `refactor`: リファクタリング
- `docs`: ドキュメント更新
- `style`: コードフォーマット
- `test`: テスト追加
- `chore`: ビルド設定等

#### コミット単位

- Phase単位でコミット
- 機能単位で細かくコミット
- 意味のあるまとまりで分割

### 3. ブランチ戦略

```
main (本番)
  ├─ v1.0.0-vue-legacy (タグ: Vue版を保存)
  └─ feature/react-migration (開発ブランチ)
       ├─ Phase 0: ファイル整理 ✅
       ├─ Phase 1: 環境構築 ⏳
       ├─ Phase 2: TypeScript移行
       ├─ Phase 3: React実装
       └─ Phase 4: テスト・デプロイ
```

#### ルール

- 開発は `feature/react-migration` で実施
- `main` には動作確認済みのコードのみマージ
- GitHub Pages は `main` からのみデプロイ
- 破壊的変更は `feature/*` で実験

### 4. コード設計原則

#### Pure Function優先

- hidden DOM要素経由のHTML生成を廃止
- データから直接HTML文字列を生成
- テスタブルな関数設計

#### フレームワーク非依存

- ビジネスロジックは `src/lib/` に集約
- Reactに依存しない実装
- 将来的なNext.js移行を考慮

#### 型安全性

- TypeScript strict mode
- 明示的な型定義
- `any` の使用を最小化

---

## 実装フェーズ

### Phase 0: 準備 ✅

- [x] タグ作成（v1.0.0-vue-legacy）
- [x] 開発ブランチ作成
- [x] legacyフォルダ作成・ファイル移動
- [x] 不要ファイル削除

### Phase 1: 環境構築 ⏳

- [x] Node.js 22インストール
- [x] package.json作成
- [x] 依存関係インストール
- [x] ディレクトリ構造作成
- [x] 設定ファイル作成（vite.config.ts, tsconfig.json）
- [x] .gitignore作成
- [ ] main.tsx, App.tsx作成
- [ ] GitHub Actions設定

### Phase 2: TypeScript移行

- [ ] 型定義作成（`src/types/`）
- [ ] 定数・ユーティリティ移行
- [ ] ログ解析ロジック移行
- [ ] テンプレート生成ロジック移行

### Phase 3: React実装

- [ ] Zustandストア実装
- [ ] カスタムフック実装
- [ ] 共通コンポーネント実装
- [ ] 機能コンポーネント実装

### Phase 4: テスト・デプロイ

- [ ] 手動テスト
- [ ] ビルド確認
- [ ] mainにマージ
- [ ] GitHub Pagesデプロイ

---

## 重要な決定事項

### CSS管理

- **ツールページ**: CSS Modules（スコープ付き）
- **yokogaki.js出力**: テンプレート文字列（見た目維持）
- 既存CSSを段階的に移行

### データ保存

- **クライアントサイドのみ** でデータ処理
- サーバー送信なし（プライバシー保護）
- localStorageで設定値のみ保存

### HTML生成方式

- **旧方式**: hidden DOM要素にレンダリング → innerHTML取得
- **新方式**: データから直接HTML文字列を生成（純粋関数）
- パフォーマンス向上・テスタビリティ向上

### 縦書き対応（将来）

- 共通テンプレート基盤を構築
- 横書き/縦書きでスタイルのみ切り替え
- ロジックの重複を排除

---

## 注意事項

### Git操作

- `feature/react-migration` で開発
- `main` へのコミットは慎重に（GitHub Pages更新）
- タグはマイルストーン時に作成

### ビルド

- `npm run dev` で開発サーバー起動
- `npm run build` で本番ビルド
- `npm run preview` でビルド結果確認

### 依存関係

- `node_modules/` は追跡しない（.gitignore）
- `package-lock.json` は追跡する（バージョン固定）

### 学習ノート

- `knowledge/` は個人用（追跡しない）
- 学習内容を自由に記録
- 参考書形式でまとめる

---

## 参考リンク

### 公式ドキュメント

- React: https://react.dev/
- Vite: https://vitejs.dev/
- TypeScript: https://www.typescriptlang.org/
- Vitest: https://vitest.dev/

### GitHub

- Repository: https://github.com/tastuki1/trpgLogMeke.github.io
- GitHub Pages: https://tastuki1.github.io/trpgLogMeke.github.io/

---

## 連絡事項

### AI開発補助（Claude Code）の役割

- コード生成時に意味と意図を説明
- Git操作の意味を解説
- 学習内容を knowledge/ に蓄積
- 段階的に理解を深める

### 開発者（あなた）の役割

- 最終的な実装判断
- 機能要件の決定
- 学習内容の理解確認

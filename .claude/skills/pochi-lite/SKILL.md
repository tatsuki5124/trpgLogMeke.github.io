# Pochi-lite 開発フロー

新機能を追加するときの標準作業手順。

## 1. ユーザーストーリーを feature ファイルに書く

`specs/features/<tool>/` に `.feature` ファイルを作成する。
ファイル名・Feature 記述は「ユーザーが得る価値」で命名する（技術的な境界ではない）。

```
specs/features/logmake/my-new-feature.feature
```

## 2. bddgen でステップ生成・失敗確認

```bash
pnpm bddgen
```

`.features-gen/` に生成されたテストを確認し、ステップが未実装で失敗することを確かめる。

## 3. steps にステップ定義を実装

`tests/bdd/steps/logmake.steps.ts` に `Given` / `When` / `Then` を追加する。

## 4. 実装

`src/logmake/` に機能を実装する。

## 5. 確認

```bash
pnpm test:unit    # プロパティテスト・ユニットテスト
pnpm test:bdd     # BDD シナリオ (bddgen → playwright)
pnpm lint
pnpm build
```

## 仕様ドリフト確認

`specs/features/` と `e2e/` で重複・矛盾がないか定期確認する。

- `e2e/logmake.spec.ts` は既存の legacy テスト。新しいシナリオは BDD 側に追加する。
- `specs/features/` の `.feature` が正規の仕様ドキュメント。
- ドリフトを発見したら `.feature` を正として `e2e/` を更新する。

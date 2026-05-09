@logmake @html-distribution
Feature: セッションログの整形・配布

  セッション参加者として、セッションログから配布用 HTML を生成できる。
  それによって、他の参加者に読みやすいログを共有できる。

  Scenario: セッションログから配布用 HTML を生成できる
    Given 基本形式のセッションログがある
    When ログを整形する
    Then 整形結果にキャラクター名「探索者A」が表示される
    And 配布用 HTML をダウンロードできる
    And ダウンロードした HTML にキャラクター名「探索者A」が含まれる
    And ダウンロードした HTML では主要タブと補助タブが区別される

  Scenario: 危険な本文 HTML を安全化して配布用 HTML を生成できる
    Given 危険な本文 HTML を含むセッションログがある
    When ログを整形する
    Then 配布用 HTML をダウンロードできる
    And ダウンロードした HTML に危険な本文 HTML が残らない
    And ダウンロードした HTML を UTF-8 として読める

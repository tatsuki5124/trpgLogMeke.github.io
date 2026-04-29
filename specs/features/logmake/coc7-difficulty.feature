@logmake @coc7
Feature: CoC7 難易度判定の確認

  セッション参加者として、CoC7 セッションログから、通常成功・ハード成功・イクストリーム成功を確認できる。
  それによって、CoC7 のセッションでもダイス結果を活用できる。

  Scenario Outline: CoC7 の成功段階が分類される
    Given CoC7 の判定ログ「<fixture>」がある
    When ログを整形する
    Then 判定結果に「<expected>」が表示される

    Examples:
      | fixture                   | expected           |
      | coc7-hard-success.html    | ハード成功         |
      | coc7-extreme-success.html | イクストリーム成功 |

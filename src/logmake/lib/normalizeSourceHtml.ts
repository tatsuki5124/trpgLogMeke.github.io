/** おみくじ結果ブロックを検出する正規表現。改行を <br> に変換して1トークンに収める */
const OMIKUJI_REGEX = /今日のあなたの運勢は……？ \n【.*】/g

/** createLogSourceNormalizer に渡すマルチロール正規化の設定 */
export interface SourceNormalizerOptions {
  multiRollRegex: RegExp
  skillMultiRollRegex: RegExp
}

/**
 * ソース HTML 正規化関数を生成するファクトリ。
 * CCFOLIA のマルチロール記法とおみくじ記法を <br> 区切りに変換する。
 *
 * @param options - マルチロールを検出する正規表現の設定
 * @returns HTML コンテンツを受け取り正規化した文字列を返す関数
 */
export function createLogSourceNormalizer({
  multiRollRegex,
  skillMultiRollRegex,
}: SourceNormalizerOptions): (content: string) => string {
  return (content) => {
    let normalized = content.replace(/\r\n/g, '\n')

    normalized = normalized.replace(multiRollRegex, (block: string) =>
      normalizeMultiRollBlock(block, skillMultiRollRegex),
    )

    return normalized.replace(OMIKUJI_REGEX, (block: string) =>
      block.replace(/\n/g, '<br>'),
    )
  }
}

/**
 * マルチロールブロックを解析し、コマンド行と結果行を <br> 区切りの1行に整形する。
 * 技能コマンド形式の場合は各結果行にコマンド情報を付加する。
 *
 * @param block - マルチロールの生テキストブロック
 * @param skillMultiRollRegex - 技能コマンド形式を検出する正規表現
 * @returns <br> 区切りに整形した文字列
 */
function normalizeMultiRollBlock(
  block: string,
  skillMultiRollRegex: RegExp,
): string {
  const lines = block
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line: string) => line.trim())
    .filter(Boolean)

  const commandLine = lines[0]?.replace(/\s+#1$/, '') ?? ''
  const resultLines = lines
    .slice(1)
    .filter((line: string) => !line.startsWith('#'))
  const skillMatch = block.match(skillMultiRollRegex)

  const repeatedCommand = readRepeatedCommand(commandLine)

  if (!skillMatch) {
    return [
      commandLine,
      ...resultLines.map((line: string) =>
        appendRepeatedCommand(repeatedCommand, line),
      ),
    ].join('<br>')
  }

  const [, , command, target, skill] = skillMatch
  const repeatedSkillCommand = `${command}&lt;=${target} 【${skill}】`

  return [
    commandLine,
    ...resultLines.map((line: string) =>
      appendRepeatedCommand(repeatedSkillCommand, line),
    ),
  ].join('<br>')
}

function readRepeatedCommand(commandLine: string): string {
  return commandLine
    .replace(/^(?:x|rep|repeat)\d+(?: |\u3000)/i, '')
    .replace(/\s+#1$/, '')
    .trim()
}

function appendRepeatedCommand(command: string, resultLine: string): string {
  if (!command || resultLine.startsWith(command)) {
    return resultLine
  }

  if (resultLine.startsWith('(1D100') || resultLine.startsWith('＞')) {
    return `${command} ${resultLine}`
  }

  return `${command} ＞ ${resultLine}`
}

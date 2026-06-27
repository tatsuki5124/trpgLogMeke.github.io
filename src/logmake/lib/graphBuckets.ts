import type { DiceRecord } from '@/logmake/types'

/** ダイス値のグラフ用バケットラベル（"1-5" ～ "96-100" の 20 段階） */
export const GRAPH_LABELS = Array.from(
  { length: 20 },
  (_, index) => `${index * 5 + 1}-${(index + 1) * 5}`,
)

/**
 * DiceRecord の配列をダイス値の 5 刻みバケットに集計する。
 *
 * @param records - 集計対象のダイスレコード配列
 * @returns 各バケットのカウント配列（インデックス 0 が 1-5、インデックス 19 が 96-100）
 */
export function graphBuckets(records: DiceRecord[]): number[] {
  const buckets = Array.from({ length: 20 }, () => 0)

  for (const record of records) {
    const bucketIndex = Math.min(
      Math.max(Math.floor((record.value - 1) / 5), 0),
      buckets.length - 1,
    )
    buckets[bucketIndex] += 1
  }

  return buckets
}

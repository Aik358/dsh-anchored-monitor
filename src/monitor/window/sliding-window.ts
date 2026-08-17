/**
 * 固定滑动窗口: 维护最近 N 个 FeatureVector, 增量更新聚合值
 */

import type { FeatureVector, WindowSnapshot } from '../../shared/types.js'

export interface WindowAggregator {
  push(vec: FeatureVector, timestampMs: number): WindowSnapshot
  reset(): void
  current: WindowSnapshot | null
}

export class SlidingWindow implements WindowAggregator {
  private vectors: { vec: FeatureVector; ts: number }[] = []
  private windowId = 0
  current: WindowSnapshot | null = null

  constructor(private readonly maxSize: number) {}

  push(vec: FeatureVector, _timestampMs: number): WindowSnapshot {
    this.vectors.push({ vec, ts: 0 })
    if (this.vectors.length > this.maxSize) this.vectors.shift()
    return this.snapshot()
  }

  reset(): void {
    this.vectors = []
    this.current = null
  }

  private snapshot(): WindowSnapshot {
    let positive = 0
    let negative = 0
    let neutral = 0
    const features: Record<string, number> = {}
    for (const { vec } of this.vectors) {
      positive += vec.weighted.positive
      negative += vec.weighted.negative
      neutral += vec.weighted.neutral
      for (const [k, v] of Object.entries(vec.counts)) {
        features[k] = (features[k] ?? 0) + v
      }
    }
    this.windowId += 1
    const snap: WindowSnapshot = {
      windowId: this.windowId,
      size: this.vectors.length,
      aggregate: { positive, negative, neutral },
      features
    }
    this.current = snap
    return snap
  }
}

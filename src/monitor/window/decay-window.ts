/**
 * 指数衰减窗口: 更强调近期行为
 * 聚合值 = Σ vector_i × exp(-lambda × (t_now - t_i)), t_now 取窗口内最新时间戳
 */

import type { FeatureVector, WindowSnapshot } from '../../shared/types.js'
import type { WindowAggregator } from './sliding-window.js'

const MIN_WEIGHT = 0.001

export class DecayWindow implements WindowAggregator {
  private vectors: { vec: FeatureVector; ts: number }[] = []
  private windowId = 0
  current: WindowSnapshot | null = null

  constructor(private readonly lambda: number) {}

  push(vec: FeatureVector, timestampMs: number): WindowSnapshot {
    this.vectors.push({ vec, ts: timestampMs })
    return this.snapshot()
  }

  reset(): void {
    this.vectors = []
    this.current = null
  }

  private snapshot(): WindowSnapshot {
    let last = 0
    for (const v of this.vectors) if (v.ts > last) last = v.ts
    let positive = 0
    let negative = 0
    let neutral = 0
    const features: Record<string, number> = {}
    let kept = 0
    for (const { vec, ts } of this.vectors) {
      const w = Math.exp(-this.lambda * (last - ts))
      if (w < MIN_WEIGHT) continue
      kept += 1
      positive += vec.weighted.positive * w
      negative += vec.weighted.negative * w
      neutral += vec.weighted.neutral * w
      for (const [k, v] of Object.entries(vec.counts)) {
        features[k] = (features[k] ?? 0) + v * w
      }
    }
    // 丢弃已衰减到忽略阈值的旧向量
    this.vectors = this.vectors.slice(Math.max(0, this.vectors.length - Math.max(kept, 8)))
    this.windowId += 1
    const snap: WindowSnapshot = {
      windowId: this.windowId,
      size: kept,
      aggregate: { positive, negative, neutral },
      features
    }
    this.current = snap
    return snap
  }
}

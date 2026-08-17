/**
 * 动态基线: 维护最近 N 个归一化分的均值/标准差
 * 基线样本不足 baseline_min_samples 时返回 null(不判定)
 */

export interface BaselineStats {
  mean: number | null
  std: number | null
  samples: number
}

export class BaselineCalculator {
  private scores: number[] = []

  constructor(
    private readonly windowSize: number,
    private readonly minSamples: number
  ) {}

  push(score: number): BaselineStats {
    this.scores.push(score)
    if (this.scores.length > this.windowSize) this.scores.shift()
    return this.stats()
  }

  stats(): BaselineStats {
    const n = this.scores.length
    if (n < this.minSamples) return { mean: null, std: null, samples: n }
    let mean = 0
    for (const x of this.scores) mean += x
    mean /= n
    let variance = 0
    for (const x of this.scores) variance += (x - mean) * (x - mean)
    variance /= n
    return { mean, std: Math.sqrt(variance), samples: n }
  }

  reset(): void {
    this.scores = []
  }

  get size(): number {
    return this.scores.length
  }

  get mean(): number | null {
    return this.stats().mean
  }

  get std(): number | null {
    return this.stats().std
  }
}

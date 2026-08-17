/**
 * 评分策略: weighted_ratio / percentile / composite + 分位数归一化
 * 所有权重配置化, 无硬编码策略
 */

import type { ScoringConfig, ScoringWeights, WindowSnapshot } from '../../shared/types.js'

export interface ScoringContext {
  snap: WindowSnapshot
  /** 历史原始分(不含当前), 用于分位数归一化 */
  rawHistory: number[]
  percentileWindow: number
}

export interface ScoringOutput {
  raw: number
  components: Record<string, number>
  /** 0-100: 分位数归一化(或裁剪后的原始分) */
  normalized: number
  /** 原始分在历史中的分位 0-100; 历史为空时为 null */
  percentile: number | null
}

export interface ScoringStrategy {
  compute(ctx: ScoringContext): ScoringOutput
}

export function weightedRatioValue(agg: WindowSnapshot['aggregate'], w: ScoringWeights): number {
  return (w.alpha * agg.positive + w.beta * agg.neutral) / (w.gamma * agg.negative + w.epsilon)
}

export function percentileRank(value: number, history: number[]): number | null {
  if (history.length === 0) return null
  let below = 0
  for (const x of history) if (x < value) below += 1
  return (below / history.length) * 100
}

class WeightedRatioScoring implements ScoringStrategy {
  constructor(private readonly config: ScoringConfig, private readonly forcePercentile: boolean) {}

  compute(ctx: ScoringContext): ScoringOutput {
    const raw = weightedRatioValue(ctx.snap.aggregate, this.config.weights)
    const percentile = percentileRank(raw, ctx.rawHistory)
    const normalized =
      this.config.normalize || this.forcePercentile
        ? (percentile ?? 50)
        : Math.min(100, Math.max(0, raw))
    return {
      raw,
      components: {
        weighted_ratio: raw,
        positive: ctx.snap.aggregate.positive,
        negative: ctx.snap.aggregate.negative,
        neutral: ctx.snap.aggregate.neutral
      },
      normalized,
      percentile
    }
  }
}

class CompositeScoring implements ScoringStrategy {
  private history: Record<string, number[]> = {}

  constructor(private readonly config: ScoringConfig) {}

  compute(ctx: ScoringContext): ScoringOutput {
    const comps = this.config.composite?.components ?? []
    const components: Record<string, number> = {}
    let sum = 0
    let totalWeight = 0
    for (const c of comps) {
      const value = this.componentValue(c.kind, c.name, ctx.snap)
      const h = (this.history[c.name] ??= [])
      const p = percentileRank(value, h) ?? 50
      h.push(value)
      if (h.length > this.config.percentile_window) h.shift()
      components[c.name] = Math.round(p * 10) / 10
      sum += p * c.weight
      totalWeight += c.weight
    }
    const raw = totalWeight > 0 ? sum / totalWeight : 50
    const percentile = percentileRank(raw, ctx.rawHistory)
    return { raw, components, normalized: Math.min(100, Math.max(0, raw)), percentile }
  }

  private componentValue(kind: string, name: string, snap: WindowSnapshot): number {
    if (kind === 'weighted_ratio') return weightedRatioValue(snap.aggregate, this.config.weights)
    if (kind === 'question_ratio') {
      return snap.size > 0 ? (snap.features['question_marks'] ?? 0) / snap.size : 0
    }
    // feature: 直接取窗口特征值
    return snap.features[name] ?? 0
  }
}

export function createScoring(config: ScoringConfig): ScoringStrategy {
  if (config.type === 'composite') return new CompositeScoring(config)
  return new WeightedRatioScoring(config, config.type === 'percentile')
}

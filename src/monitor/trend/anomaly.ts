/**
 * 趋势检测 + 异常检测(触发规则全部配置化) + 迟滞恢复判定
 */

import type { BandsConfig, ThresholdConfig, TrendDirection, TriggerRule } from '../../shared/types.js'
import type { BaselineStats } from './baseline.js'

export function meanOf(xs: number[]): number {
  if (xs.length === 0) return 0
  let s = 0
  for (const x of xs) s += x
  return s / xs.length
}

export function stddevOf(xs: number[]): number {
  if (xs.length === 0) return 0
  const m = meanOf(xs)
  let v = 0
  for (const x of xs) v += (x - m) * (x - m)
  return Math.sqrt(v / xs.length)
}

/** 近期窗口均值相对前一窗口均值的漂移, 以全局标准差归一 */
export function computeTrend(
  scores: number[],
  window: number,
  slopeSigma: number
): TrendDirection {
  if (scores.length < window + 1) return 'stable'
  const recent = scores.slice(-window)
  const prev = scores.slice(-window * 2, -window)
  if (prev.length === 0) return 'stable'
  const std = stddevOf(scores) + 1e-6
  const delta = (meanOf(recent) - meanOf(prev)) / std
  if (delta > slopeSigma) return 'rising'
  if (delta < -slopeSigma) return 'falling'
  return 'stable'
}

export interface AnomalyInput {
  normalized: number
  percentile: number | null
  baseline: BaselineStats
  personaRatio: number | null
  config: ThresholdConfig
  bands: BandsConfig
}

export interface AnomalyResult {
  triggered: boolean
  matched: string[]
  severity: 'warning' | 'critical'
  /** 是否命中波段规则(mixed_band/react_band) — 波段跨越不需要趋势佐证 */
  bandHit: boolean
}

function ruleLabel(rule: TriggerRule): string {
  if (rule.type === 'sigma') return `sigma(k=${rule.k ?? '?'})`
  if (rule.type === 'percentile') return `percentile(p=${rule.p ?? '?'})`
  if (rule.type === 'safety_floor') return 'safety_floor'
  if (rule.type === 'mixed_band') return 'mixed_band'
  return 'react_band'
}

export function checkAnomalies(input: AnomalyInput): AnomalyResult {
  const matched: string[] = []
  let severity: 'warning' | 'critical' = 'warning'
  let bandHit = false
  for (const rule of input.config.trigger) {
    let hit = false
    switch (rule.type) {
      case 'sigma':
        hit =
          input.baseline.mean !== null &&
          input.baseline.std !== null &&
          input.normalized < input.baseline.mean - (rule.k ?? 1.5) * input.baseline.std
        break
      case 'percentile':
        hit = input.percentile !== null && input.percentile < (rule.p ?? 5)
        break
      case 'safety_floor':
        hit = input.normalized < input.config.safety_floor
        break
      case 'mixed_band':
        hit = input.personaRatio !== null && input.personaRatio >= input.bands.spec_max
        break
      case 'react_band':
        hit = input.personaRatio !== null && input.personaRatio >= input.bands.react_min
        break
    }
    if (hit) {
      matched.push(ruleLabel(rule))
      if (rule.severity === 'critical') severity = 'critical'
      if (rule.type === 'mixed_band' || rule.type === 'react_band') bandHit = true
    }
  }
  return { triggered: matched.length > 0, matched, severity, bandHit }
}

export interface RecoveryInput {
  normalized: number
  baseline: BaselineStats
  trend: TrendDirection
  ratio: number | null
  bands: BandsConfig
  config: ThresholdConfig
}

/**
 * 迟滞恢复判定(防阈值附近抖动):
 *  - spec_band(默认): 窗口 persona_ratio 回到 spec 带(< spec_max)且趋势不降
 *  - sigma: 归一化分恢复到 μ−kσ 以上且趋势不降
 *  - safety_floor: 归一化分回到安全线以上且趋势不降
 */
export function isRecovered(input: RecoveryInput): boolean {
  const rule = input.config.recovery
  if (rule.type === 'spec_band') {
    return (
      input.ratio !== null &&
      input.ratio < input.bands.spec_max &&
      input.baseline.mean !== null &&
      input.trend !== 'falling'
    )
  }
  if (rule.type === 'sigma') {
    if (input.baseline.mean === null || input.baseline.std === null) return false
    const threshold = input.baseline.mean - (rule.k ?? 0.5) * input.baseline.std
    return input.normalized >= threshold && input.trend !== 'falling'
  }
  return input.normalized >= input.config.safety_floor && input.trend !== 'falling'
}

/**
 * 分级干预决策状态机
 *
 *        ┌────────────┐  触发异常+下降趋势   ┌────────────┐
 *        │  healthy   │ ──────────────────► │  warning   │ ──恢复──► healthy
 *        └─────┬──────┘   (severity=critical └─────┬──────┘
 *              │            直接进入 critical)      │ 持续恶化 / critical 级异常
 *              ▼                                   ▼
 *        ┌────────────┐      L2 重试            ┌────────────┐
 *        │   restart  │ ◄── 次数超限 ────────── │  critical  │
 *        └────────────┘                          └─────┬──────┘
 *                                                    └──恢复──► healthy
 * 干预级别由配置规则 intervention.rules 决定, 全部可调
 */

import type { InterventionConfig, InterventionLevel, Phase, TrendDirection } from '../../shared/types.js'

export interface DecisionInput {
  phase: Phase
  trend: TrendDirection
  anomalyTriggered: boolean
  anomalySeverity: 'warning' | 'critical'
  /** 波段规则命中(mixed/react): 波段跨越本身即证据, 不需要趋势佐证 */
  bandHit: boolean
  recovered: boolean
  l2Attempts: number
  config: InterventionConfig
}

export interface DecisionOutput {
  level: InterventionLevel
  nextPhase: Phase
  resetL2Attempts: boolean
  reason: string
}

function pickAction(
  phase: 'warning' | 'critical',
  trend: TrendDirection,
  attempts: number,
  config: InterventionConfig
): Exclude<InterventionLevel, 'none'> {
  for (const rule of config.rules) {
    if (rule.when !== phase) continue
    if (rule.trend !== undefined && rule.trend !== trend) continue
    if (rule.L2_attempts_lt !== undefined && !(attempts < rule.L2_attempts_lt)) continue
    if (rule.L2_attempts_gte !== undefined && !(attempts >= rule.L2_attempts_gte)) continue
    return rule.action
  }
  return phase === 'warning' ? 'L1' : attempts < config.max_L2_attempts ? 'L2' : 'L3'
}

export function decideIntervention(input: DecisionInput): DecisionOutput {
  const { config } = input
  switch (input.phase) {
    case 'healthy': {
      // 统计类规则(sigma/percentile)需要下降趋势佐证; 波段规则自带证据
      const enter = input.anomalyTriggered && (input.bandHit || input.trend === 'falling')
      if (enter) {
        if (input.anomalySeverity === 'critical') {
          return {
            level: pickAction('critical', input.trend, input.l2Attempts, config),
            nextPhase: 'critical',
            resetL2Attempts: false,
            reason: 'critical 级异常(react 带), 直接重置'
          }
        }
        return {
          level: pickAction('warning', input.trend, input.l2Attempts, config),
          nextPhase: 'warning',
          resetL2Attempts: false,
          reason: '进入过渡带(mixed band), 开启警告'
        }
      }
      return { level: 'none', nextPhase: 'healthy', resetL2Attempts: false, reason: 'healthy' }
    }
    case 'warning': {
      if (input.recovered) {
        return { level: 'none', nextPhase: 'healthy', resetL2Attempts: false, reason: '分数恢复且趋势不再下降' }
      }
      // 升级只看证据强度: 进入 react 带即 critical, 不用分位数恶化启发式(噪声大)
      if (input.anomalyTriggered && input.anomalySeverity === 'critical') {
        return {
          level: pickAction('critical', input.trend, input.l2Attempts, config),
          nextPhase: 'critical',
          resetL2Attempts: false,
          reason: '升级为 critical 级异常(react 带)'
        }
      }
      return { level: 'none', nextPhase: 'warning', resetL2Attempts: false, reason: 'warning 持续' }
    }
    case 'critical': {
      if (input.recovered) {
        return { level: 'none', nextPhase: 'healthy', resetL2Attempts: true, reason: '重置后恢复' }
      }
      // 持续处于 react 带/安全线(critical 级)也升级, 不要求趋势下降:
      // 稳定停在坏吸引子本身就是 react 证据
      const escalate = input.anomalyTriggered && (input.trend === 'falling' || input.anomalySeverity === 'critical')
      if (escalate) {
        if (input.l2Attempts < config.max_L2_attempts) {
          return {
            level: 'L2',
            nextPhase: 'critical',
            resetL2Attempts: false,
            reason: `重置后仍未恢复, 重试 L2 (${input.l2Attempts + 1}/${config.max_L2_attempts})`
          }
        }
        return { level: 'L3', nextPhase: 'restart', resetL2Attempts: false, reason: 'L2 重试次数超限, 建议会话重启' }
      }
      return { level: 'none', nextPhase: 'critical', resetL2Attempts: false, reason: 'critical 持续' }
    }
    case 'restart': {
      return { level: 'none', nextPhase: 'restart', resetL2Attempts: false, reason: '等待会话重启' }
    }
  }
}

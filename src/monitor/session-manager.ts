/**
 * SessionManager — 每会话监控流水线核心:
 * 特征提取 → 窗口聚合 → 评分 → 基线/趋势/异常 → 决策状态机 → 信号发送
 * 所有可调参数来自 MonitorConfig, 无硬编码策略
 */

import type {
  Band,
  InterventionLevel,
  InterventionSignal,
  MonitorConfig,
  MonitorEvent,
  Phase,
  ReasoningBlock,
  SessionSnapshot,
  SessionSummary,
  TrendDirection,
  WindowSnapshot
} from '../shared/types.js'
import { FeatureExtractor } from './feature/extractor.js'
import type { CompiledLexicon } from './feature/lexicon.js'
import { SlidingWindow } from './window/sliding-window.js'
import { DecayWindow } from './window/decay-window.js'
import type { WindowAggregator } from './window/sliding-window.js'
import { createScoring, type ScoringStrategy } from './scoring/index.js'
import { BaselineCalculator } from './trend/baseline.js'
import { checkAnomalies, computeTrend, isRecovered } from './trend/anomaly.js'
import { CooldownManager } from './intervention/cooldown.js'
import { decideIntervention } from './intervention/decision.js'
import { SignalSender } from './intervention/signal-sender.js'

const MAX_HISTORY_POINTS = 5000
const MAX_NORMALIZED_HISTORY = 400

interface HistoryPoint {
  sequence: number
  timestamp: number
  score: number
  normalizedScore: number
  band: Band
  trend: TrendDirection
  phase: Phase
  ratio: number | null
  confidence: number
  percentile: number | null
  windowAggregate: { positive: number; negative: number; neutral: number }
}

interface InterventionRecord {
  level: Exclude<InterventionLevel, 'none'>
  reason: string
  timestamp: number
  sequence: number
  status: 'sent' | 'acked'
  ackedAt?: number
  payload: InterventionSignal['payload']
}

interface SessionState {
  sessionId: string
  source: 'log_tail' | 'ipc_push'
  startedAt: number
  lastActivityAt: number
  blockCount: number
  lastSequence: number
  phase: Phase
  l2Attempts: number
  window: WindowAggregator
  baseline: BaselineCalculator
  rawHistory: number[]
  normalizedHistory: number[]
  history: HistoryPoint[]
  cooldowns: CooldownManager
  interventions: InterventionRecord[]
  lastNormalized: number | null
  ended: boolean
}

export interface SessionManagerOptions {
  config: MonitorConfig
  configHash: string
  lexicon: CompiledLexicon
  extractor: FeatureExtractor
  scoring: ScoringStrategy
  emit: (event: MonitorEvent) => void
  sender: SignalSender
}

/** persona_ratio = 窗口内 "let me" 词数 / (正向词数 + "let me" 词数), 见 router-core.bandOf */
export function personaRatio(snap: WindowSnapshot, lexicon: CompiledLexicon): number | null {
  let pos = 0
  let neg = 0
  for (const t of lexicon.positiveTerms) pos += snap.features[t] ?? 0
  for (const t of lexicon.negativeTerms) neg += snap.features[t] ?? 0
  const total = pos + neg
  return total > 0 ? neg / total : null
}

export class SessionManager {
  private sessions = new Map<string, SessionState>()
  private interventionsEnabled: boolean

  constructor(private readonly opts: SessionManagerOptions) {
    this.interventionsEnabled = opts.config.intervention.enabled !== false
  }

  /** 运行时切换干预总开关(关闭=只监控不干预, 不丢会话状态) */
  setInterventionsEnabled(enabled: boolean): void {
    if (this.interventionsEnabled === enabled) return
    this.interventionsEnabled = enabled
    this.opts.emit({ type: 'intervention_toggle', timestamp: Date.now(), enabled })
    if (!enabled) {
      // 关闭干预时, 挂起状态回到健康(不再累积 critical 升级)
      for (const state of this.sessions.values()) {
        if (state.phase !== 'restart') state.phase = 'healthy'
      }
    }
  }

  isInterventionsEnabled(): boolean {
    return this.interventionsEnabled
  }

  private bandOf(ratio: number | null, baseline: BaselineCalculator): Band {
    if (ratio === null || baseline.mean === null) return 'unknown'
    if (ratio < this.opts.config.bands.spec_max) return 'spec'
    if (ratio < this.opts.config.bands.react_min) return 'mixed'
    return 'react'
  }

  private getOrCreate(sessionId: string, source: 'log_tail' | 'ipc_push'): SessionState {
    const existing = this.sessions.get(sessionId)
    if (existing) return existing
    const cfg = this.opts.config
    const state: SessionState = {
      sessionId,
      source,
      startedAt: Date.now(),
      lastActivityAt: Date.now(),
      blockCount: 0,
      lastSequence: 0,
      phase: 'healthy',
      l2Attempts: 0,
      window:
        cfg.window.type === 'decay'
          ? new DecayWindow(cfg.window.decay_lambda)
          : new SlidingWindow(cfg.window.size),
      baseline: new BaselineCalculator(cfg.threshold.baseline_window, cfg.threshold.baseline_min_samples),
      rawHistory: [],
      normalizedHistory: [],
      history: [],
      cooldowns: new CooldownManager(cfg.intervention.cooldowns),
      interventions: [],
      lastNormalized: null,
      ended: false
    }
    this.sessions.set(sessionId, state)
    this.opts.emit({
      type: 'session_start',
      sessionId,
      timestamp: state.startedAt,
      configHash: this.opts.configHash
    })
    return state
  }

  registerSession(sessionId: string, source: 'log_tail' | 'ipc_push' = 'ipc_push'): void {
    this.getOrCreate(sessionId, source)
  }

  /** 幂等摄入一个 reasoning 块: 块内 sequence 只增不减 */
  ingest(block: ReasoningBlock): void {
    const state = this.getOrCreate(block.sessionId, block.source === 'log' ? 'log_tail' : 'ipc_push')
    const seq = block.sequence > 0 ? block.sequence : state.lastSequence + 1
    if (seq <= state.lastSequence) return // 重复/乱序块丢弃
    state.lastSequence = seq
    state.blockCount += 1
    state.lastActivityAt = Date.now()

    this.opts.emit({
      type: 'block_received',
      sessionId: block.sessionId,
      timestamp: block.timestamp,
      sequence: seq,
      textLength: block.text.length
    })

    const vec = this.opts.extractor.extract(block)
    const snap = state.window.push(vec, block.timestamp)
    this.opts.emit({
      type: 'window_updated',
      sessionId: block.sessionId,
      timestamp: block.timestamp,
      sequence: seq,
      windowId: snap.windowId,
      windowSize: snap.size,
      features: snap.features
    })

    const cfg = this.opts.config
    const scored = this.opts.scoring.compute({
      snap,
      rawHistory: state.rawHistory,
      percentileWindow: cfg.scoring.percentile_window
    })
    state.rawHistory.push(scored.raw)
    if (state.rawHistory.length > cfg.scoring.percentile_window) state.rawHistory.shift()
    state.normalizedHistory.push(scored.normalized)
    if (state.normalizedHistory.length > MAX_NORMALIZED_HISTORY) state.normalizedHistory.shift()

    const baseline = state.baseline.push(scored.normalized)
    const trend = computeTrend(state.normalizedHistory, cfg.threshold.trend_window, cfg.threshold.trend_slope_sigma)
    const ratio = personaRatio(snap, this.opts.lexicon)
    const band = this.bandOf(ratio, state.baseline)
    const confidence =
      Math.min(1, state.baseline.size / cfg.threshold.baseline_min_samples) *
      (cfg.window.type === 'sliding' ? Math.min(1, snap.size / cfg.window.size) : 1)

    this.opts.emit({
      type: 'score_computed',
      sessionId: block.sessionId,
      timestamp: block.timestamp,
      sequence: seq,
      windowSize: snap.size,
      score: scored.raw,
      normalizedScore: scored.normalized,
      band,
      trend,
      features: { ...snap.features, ratio: ratio ?? -1, confidence },
      baselineMean: baseline.mean,
      baselineStd: baseline.std,
      phase: state.phase,
      percentile: scored.percentile
    })

    const anomaly = checkAnomalies({
      normalized: scored.normalized,
      percentile: scored.percentile,
      baseline,
      personaRatio: ratio,
      config: cfg.threshold,
      bands: cfg.bands
    })
    this.opts.emit({
      type: 'threshold_check',
      sessionId: block.sessionId,
      timestamp: block.timestamp,
      sequence: seq,
      triggered: anomaly.triggered,
      matched: anomaly.matched
    })

    const recovered = isRecovered({
      normalized: scored.normalized,
      baseline,
      trend,
      ratio,
      bands: cfg.bands,
      config: cfg.threshold
    })

    const decision = decideIntervention({
      phase: state.phase,
      trend,
      anomalyTriggered: anomaly.triggered,
      anomalySeverity: anomaly.severity,
      bandHit: anomaly.bandHit,
      recovered,
      l2Attempts: state.l2Attempts,
      config: cfg.intervention
    })
    if (!this.interventionsEnabled && decision.level !== 'none') {
      // 干预总开关关闭: 只监控不干预(评分/波段/阈值事件照常, 决策被拦截)
      decision.level = 'none'
      decision.nextPhase = 'healthy'
      decision.resetL2Attempts = true
      decision.reason = 'interventions disabled'
    }
    state.lastNormalized = scored.normalized
    if (decision.resetL2Attempts) state.l2Attempts = 0

    if (decision.level !== 'none' && state.phase !== 'restart') {
      if (!state.cooldowns.isReady(decision.level, block.timestamp)) {
        this.opts.emit({
          type: 'intervention_executed',
          sessionId: block.sessionId,
          timestamp: block.timestamp,
          sequence: seq,
          level: decision.level,
          status: 'cooldown'
        })
      } else {
        const signal = this.buildSignal(state, decision.level, decision.reason, block.timestamp)
        state.cooldowns.markSent(decision.level, block.timestamp)
        state.phase = decision.nextPhase
        if (decision.level === 'L2') {
          state.l2Attempts += 1
          this.resetWindow(state)
        }
        if (decision.level === 'L3') state.phase = 'restart'
        state.interventions.push({
          level: decision.level,
          reason: decision.reason,
          timestamp: block.timestamp,
          sequence: seq,
          status: 'sent',
          payload: signal.payload
        })
        this.opts.emit({
          type: 'intervention_triggered',
          sessionId: block.sessionId,
          timestamp: block.timestamp,
          sequence: seq,
          level: decision.level,
          reason: decision.reason,
          payload: signal.payload
        })
        void this.opts.sender.send(signal)
      }
    } else if (decision.nextPhase !== state.phase) {
      state.phase = decision.nextPhase
    }

    const point: HistoryPoint = {
      sequence: seq,
      timestamp: block.timestamp,
      score: scored.raw,
      normalizedScore: scored.normalized,
      band,
      trend,
      phase: state.phase,
      ratio,
      confidence,
      percentile: scored.percentile,
      windowAggregate: { ...snap.aggregate }
    }
    state.history.push(point)
    if (state.history.length > MAX_HISTORY_POINTS) state.history.shift()
  }

  private buildSignal(
    state: SessionState,
    level: Exclude<InterventionLevel, 'none'>,
    reason: string,
    timestamp: number
  ): InterventionSignal {
    const cfg = this.opts.config
    if (level === 'L1') {
      const l1Count = state.interventions.filter((i) => i.level === 'L1').length
      const id = l1Count % Math.max(1, cfg.intervention.hint_templates.length)
      const hintText = cfg.intervention.hint_templates[id] ?? ''
      return {
        sessionId: state.sessionId,
        level,
        payload: { hintTemplateId: id, hintText },
        reason,
        timestamp
      }
    }
    if (level === 'L2') {
      return {
        sessionId: state.sessionId,
        level,
        payload: {
          reset: {
            systemPrompt: cfg.intervention.bootstrap_system_prompt,
            tools: cfg.intervention.bootstrap_tools
          }
        },
        reason,
        timestamp
      }
    }
    return {
      sessionId: state.sessionId,
      level,
      payload: { message: reason },
      reason,
      timestamp
    }
  }

  /** L2 强制重置后清空窗口与基线, 防止历史数据污染后续判断 */
  private resetWindow(state: SessionState): void {
    state.window.reset()
    state.baseline.reset()
    state.rawHistory = []
    state.normalizedHistory = []
    state.lastNormalized = null
  }

  /** 手动触发一次 L2 重置(测试/运维入口) */
  forceReset(sessionId: string): InterventionSignal | null {
    const state = this.sessions.get(sessionId)
    if (!state) return null
    const signal = this.buildSignal(state, 'L2', 'manual reset', Date.now())
    state.phase = 'critical'
    state.l2Attempts += 1
    this.resetWindow(state)
    state.interventions.push({
      level: 'L2',
      reason: 'manual reset',
      timestamp: Date.now(),
      sequence: state.lastSequence,
      status: 'sent',
      payload: signal.payload
    })
    this.opts.emit({
      type: 'intervention_triggered',
      sessionId,
      timestamp: signal.timestamp,
      sequence: state.lastSequence,
      level: 'L2',
      reason: 'manual reset',
      payload: signal.payload
    })
    void this.opts.sender.send(signal)
    return signal
  }

  ack(sessionId: string, level: Exclude<InterventionLevel, 'none'>, status: string): boolean {
    const state = this.sessions.get(sessionId)
    if (!state) return false
    for (let i = state.interventions.length - 1; i >= 0; i--) {
      const rec = state.interventions[i]
      if (rec.level === level && rec.status === 'sent') {
        rec.status = 'acked'
        rec.ackedAt = Date.now()
        this.opts.emit({
          type: 'ack_received',
          sessionId,
          timestamp: Date.now(),
          level,
          status
        })
        return true
      }
    }
    return false
  }

  endSession(sessionId: string, reason: string): void {
    const state = this.sessions.get(sessionId)
    if (!state) return
    state.ended = true
    this.opts.emit({ type: 'session_end', sessionId, timestamp: Date.now(), reason })
  }

  listSummaries(): SessionSummary[] {
    const out: SessionSummary[] = []
    for (const s of this.sessions.values()) {
      const last = s.history[s.history.length - 1]
      out.push({
        sessionId: s.sessionId,
        phase: s.phase,
        blockCount: s.blockCount,
        lastSequence: s.lastSequence,
        normalizedScore: last ? last.normalizedScore : null,
        band: last ? last.band : 'unknown',
        interventions: s.interventions.length,
        lastActivityAt: s.lastActivityAt,
        source: s.source
      })
    }
    return out
  }

  getSnapshot(sessionId: string): SessionSnapshot | null {
    const s = this.sessions.get(sessionId)
    if (!s) return null
    const baseline = s.baseline.stats()
    const last = s.history[s.history.length - 1]
    return {
      sessionId,
      phase: s.phase,
      startedAt: s.startedAt,
      lastSequence: s.lastSequence,
      blockCount: s.blockCount,
      window: s.window.current,
      latest: last
        ? {
            score: last.score,
            normalizedScore: last.normalizedScore,
            band: last.band,
            confidence: last.confidence,
            components: {},
            trend: last.trend,
            percentile: last.percentile
          }
        : null,
      baseline: { mean: baseline.mean, std: baseline.std, samples: baseline.samples },
      interventions: s.interventions.map((i) => ({
        level: i.level,
        reason: i.reason,
        timestamp: i.timestamp,
        sequence: i.sequence,
        status: i.status,
        ackedAt: i.ackedAt
      })),
      l2Attempts: s.l2Attempts,
      history: s.history.map((h) => ({
        sequence: h.sequence,
        timestamp: h.timestamp,
        score: h.score,
        normalizedScore: h.normalizedScore,
        band: h.band,
        trend: h.trend,
        phase: h.phase,
        ratio: h.ratio,
        windowAggregate: h.windowAggregate
      })),
      cooldowns: s.cooldowns.snapshot(Date.now())
    }
  }
}

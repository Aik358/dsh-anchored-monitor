/**
 * 公共类型定义 — 监控进程 / 插件宿主侧 / 仪表盘共用
 * 全部为可擦除类型(erasable syntax), 兼容 Node 24 原生 TS 与 tsc 构建
 */

/** 从模型输出中解析出的一个 reasoning 块 */
export interface ReasoningBlock {
  sessionId: string
  timestamp: number
  sequence: number          // 会话内递增序号
  text: string              // 原始 reasoning 文本
  source: 'log' | 'ipc' | 'replay' | 'demo'
}

/** 特征向量: 所有特征均可配置 */
export interface FeatureVector {
  counts: Record<string, number>
  weighted: {
    positive: number
    negative: number
    neutral: number
  }
  meta: {
    length: number
    punctuation: number
    questionMarks: number
  }
}

/** 窗口快照 */
export interface WindowSnapshot {
  windowId: number
  size: number
  aggregate: {
    positive: number
    negative: number
    neutral: number
  }
  features: Record<string, number>
}

export type Band = 'spec' | 'mixed' | 'react' | 'unknown'
export type TrendDirection = 'rising' | 'falling' | 'stable'
export type Phase = 'healthy' | 'warning' | 'critical' | 'restart'

/** 评分结果 */
export interface ScoreResult {
  score: number              // 原始加权分
  normalizedScore: number    // 映射到 0-100
  band: Band
  confidence: number
  components: Record<string, number>
}

export type InterventionLevel = 'none' | 'L1' | 'L2' | 'L3'

/** 干预决策 */
export interface InterventionDecision {
  level: InterventionLevel
  reason: string
  score: ScoreResult
  trend: TrendDirection
  cooldownRemainingMs: number
}

/** 干预信号(监控进程 → 插件) */
export interface InterventionSignal {
  sessionId: string
  level: Exclude<InterventionLevel, 'none'>
  payload: {
    hintTemplateId?: number
    hintText?: string
    reset?: {
      systemPrompt: string
      tools: string[]
    }
    message?: string
  }
  reason: string
  timestamp: number
}

/* ==================== 配置类型 ==================== */

export type MatchMode = 'exact' | 'word' | 'regex'

export interface LexiconEntry {
  term: string
  weight: number
  match: MatchMode
  caseInsensitive?: boolean
}

export interface RegexFeature {
  name: string
  pattern: string
  weight: number
}

export interface LexiconConfig {
  positive: LexiconEntry[]
  negative: LexiconEntry[]
  neutral: LexiconEntry[]
}

export interface WindowConfig {
  type: 'sliding' | 'decay'
  size: number
  decay_lambda: number
}

export interface ScoringWeights {
  alpha: number
  beta: number
  gamma: number
  epsilon: number
}

export interface CompositeComponent {
  name: string
  kind: 'weighted_ratio' | 'question_ratio' | 'length_ratio'
  weight: number
}

export interface ScoringConfig {
  type: 'weighted_ratio' | 'percentile' | 'composite'
  weights: ScoringWeights
  normalize: boolean
  percentile_window: number
  composite?: { components: CompositeComponent[] }
}

/**
 * 三波段量化 — 严格对齐 dsh-router-standard router-core.mjs bandOf():
 * persona_ratio < spec_max → spec; < react_min → mixed(过渡带); >= react_min → react
 */
export interface BandsConfig {
  mode: 'persona_ratio'
  spec_max: number
  react_min: number
}

export interface TriggerRule {
  type: 'sigma' | 'percentile' | 'safety_floor' | 'mixed_band' | 'react_band' | 'spec_band'
  k?: number
  p?: number
  /** 命中后的初始严重度: warning → L1 温和引导; critical → 直接 L2 重置 */
  severity?: 'warning' | 'critical'
}

export interface ThresholdConfig {
  baseline_min_samples: number
  baseline_window: number
  trend_window: number
  trend_slope_sigma: number
  trigger: TriggerRule[]
  recovery: TriggerRule
  safety_floor: number
}

export interface CooldownsConfig {
  L1_ms: number
  L2_ms: number
  L3_ms: number
}

export interface InterventionRule {
  when: Phase
  trend?: TrendDirection
  L2_attempts_lt?: number
  L2_attempts_gte?: number
  action: Exclude<InterventionLevel, 'none'>
}

export interface InterventionConfig {
  cooldowns: CooldownsConfig
  max_L2_attempts: number
  rules: InterventionRule[]
  hint_templates: string[]
  bootstrap_tools: string[]
  bootstrap_system_prompt: string
}

export interface EventSourceConfig {
  type: 'log_tail' | 'ipc_push'
  poll_interval_ms: number
  start_from: 'beginning' | 'end'
  log_event_reasoning_fields: string[]
}

export interface ExperimentLogConfig {
  path: string
  max_file_size_mb: number
  rotate: boolean
}

export interface DashboardConfig {
  host: string
  port: number
  web_root: string
}

export interface MonitorConfig {
  version: string
  session_id_pattern: string
  event_source: EventSourceConfig
  features: {
    lexicon: LexiconConfig
    regex_features: RegexFeature[]
  }
  window: WindowConfig
  scoring: ScoringConfig
  bands: BandsConfig
  threshold: ThresholdConfig
  intervention: InterventionConfig
  experiment_log: ExperimentLogConfig
  ipc: { protocol: 'http'; host: string; port: number }
  dashboard: DashboardConfig
}

/* ==================== 监控事件(JSONL 日志 + SSE 广播) ==================== */

export type MonitorEvent =
  | { type: 'config_loaded'; timestamp: number; configHash: string; profile: string }
  | { type: 'session_start'; sessionId: string; timestamp: number; configHash: string }
  | { type: 'block_received'; sessionId: string; timestamp: number; sequence: number; textLength: number }
  | {
      type: 'window_updated'
      sessionId: string
      timestamp: number
      sequence: number
      windowId: number
      windowSize: number
      features: Record<string, number>
    }
  | {
      type: 'score_computed'
      sessionId: string
      timestamp: number
      sequence: number
      windowSize: number
      score: number
      normalizedScore: number
      band: Band
      trend: TrendDirection
      features: Record<string, number>
      baselineMean: number | null
      baselineStd: number | null
      phase: Phase
      percentile: number | null
    }
  | {
      type: 'threshold_check'
      sessionId: string
      timestamp: number
      sequence: number
      triggered: boolean
      matched: string[]
    }
  | {
      type: 'intervention_triggered'
      sessionId: string
      timestamp: number
      sequence: number
      level: InterventionLevel
      reason: string
      payload: InterventionSignal['payload']
    }
  | {
      type: 'intervention_executed'
      sessionId: string
      timestamp: number
      sequence: number
      level: InterventionLevel
      status: 'executed' | 'failed' | 'cooldown'
    }
  | { type: 'ack_received'; sessionId: string; timestamp: number; level: InterventionLevel; status: string }
  | { type: 'session_end'; sessionId: string; timestamp: number; reason: string }

/* ==================== 会话公开状态(仪表盘 API) ==================== */

export interface SessionSnapshot {
  sessionId: string
  phase: Phase
  startedAt: number
  lastSequence: number
  blockCount: number
  window: WindowSnapshot | null
  latest: ScoreResult & { trend: TrendDirection; percentile: number | null } | null
  baseline: { mean: number | null; std: number | null; samples: number }
  interventions: {
    level: InterventionLevel
    reason: string
    timestamp: number
    sequence: number
    status: 'sent' | 'acked'
    ackedAt?: number
  }[]
  l2Attempts: number
  history: {
    sequence: number
    timestamp: number
    score: number
    normalizedScore: number
    band: Band
    trend: TrendDirection
    phase: Phase
    windowAggregate: { positive: number; negative: number; neutral: number }
  }[]
  cooldowns: { L1: number; L2: number; L3: number }
}

/** 仪表盘 /api/sessions 的会话摘要 */
export interface SessionSummary {
  sessionId: string
  phase: Phase
  blockCount: number
  lastSequence: number
  normalizedScore: number | null
  band: Band
  interventions: number
  lastActivityAt: number
  source: 'log_tail' | 'ipc_push'
}

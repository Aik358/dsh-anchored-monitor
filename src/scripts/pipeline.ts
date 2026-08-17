/**
 * 离线流水线工厂: 供 replay/calibrate/demo 复用
 */

import { readFileSync } from 'node:fs'
import type { MonitorConfig, MonitorEvent, ReasoningBlock } from '../shared/types.js'
import { compileLexicon } from '../monitor/feature/lexicon.js'
import { FeatureExtractor } from '../monitor/feature/extractor.js'
import { createScoring } from '../monitor/scoring/index.js'
import { SessionManager } from '../monitor/session-manager.js'
import { SignalSender } from '../monitor/intervention/signal-sender.js'
import { decompressZstdFrames } from '../monitor/event-source/log-tail.js'

export interface Pipeline {
  lexicon: ReturnType<typeof compileLexicon>
  extractor: FeatureExtractor
  scoring: ReturnType<typeof createScoring>
  manager: SessionManager
}

export function createPipeline(
  cfg: MonitorConfig,
  opts: { configHash: string; emit: (event: MonitorEvent) => void; sender: SignalSender }
): Pipeline {
  const lexicon = compileLexicon(cfg.features.lexicon, cfg.features.regex_features)
  const extractor = new FeatureExtractor(lexicon)
  const scoring = createScoring(cfg.scoring)
  const manager = new SessionManager({
    config: cfg,
    configHash: opts.configHash,
    lexicon,
    extractor,
    scoring,
    emit: opts.emit,
    sender: opts.sender
  })
  return { lexicon, extractor, scoring, manager }
}

/** 读取 JSONL(或 .zstd)文件, 逐行 JSON.parse, 容错 */
export function readJsonlRecords(file: string): unknown[] {
  const buf = readFileSync(file)
  const text = file.endsWith('.zstd') ? decompressZstdFrames(buf) : buf.toString('utf8')
  return text
    .split('\n')
    .filter((l) => l.trim().length > 0)
    .map((l) => {
      try {
        return JSON.parse(l) as unknown
      } catch {
        return null
      }
    })
    .filter((r): r is unknown => r !== null)
}

/** 从记录提取 reasoning 块(供离线回放) */
export function blocksFromRecords(records: unknown[], sessionId: string, source: ReasoningBlock['source']): ReasoningBlock[] {
  const blocks: ReasoningBlock[] = []
  let seq = 0
  for (const r of records) {
    if (typeof r !== 'object' || r === null) continue
    const obj = r as Record<string, unknown>
    let text: string | null = null
    if (obj.type === 'reasoning_block' && typeof obj.text === 'string') text = obj.text
    else if (typeof obj.reasoning === 'string') text = obj.reasoning
    else continue
    seq += 1
    blocks.push({
      sessionId,
      timestamp: typeof obj.timestamp === 'number' ? obj.timestamp : Date.now() + seq,
      sequence: typeof obj.sequence === 'number' ? obj.sequence : seq,
      text,
      source
    })
  }
  return blocks
}

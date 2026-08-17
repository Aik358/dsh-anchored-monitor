#!/usr/bin/env node
/**
 * scripts/replay.ts — 离线回放会话日志, 输出统计摘要
 * 用法: node src/scripts/replay.ts --file demo-data/events.jsonl [--session id] [--config ...] [--profile ...] [--out logs/replay.jsonl]
 */

import { pathToFileURL } from 'node:url'
import { resolveProjectRoot, resolveFromRoot } from '../shared/paths.js'
import { loadConfig } from '../shared/config-loader.js'
import { createPipeline, readJsonlRecords, blocksFromRecords } from './pipeline.js'
import { ExperimentLogger } from '../monitor/logger/experiment-log.js'
import { SignalSender } from '../monitor/intervention/signal-sender.js'
import type { MonitorEvent } from '../shared/types.js'

function parseArgs(argv: string[]): Record<string, string> {
  const args: Record<string, string> = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (!a.startsWith('--')) continue
    const key = a.slice(2)
    const next = argv[i + 1]
    if (next !== undefined && !next.startsWith('--')) {
      args[key] = next
      i += 1
    } else args[key] = 'true'
  }
  return args
}

async function main(): Promise<void> {
  const root = resolveProjectRoot(import.meta.url)
  const args = parseArgs(process.argv.slice(2))
  const files = (args.file ?? '').split(',').map((s) => s.trim()).filter(Boolean)
  if (files.length === 0) {
    console.error('用法: replay --file <jsonl[,jsonl...]> [--session id]')
    process.exit(1)
  }
  const sessionId = args.session ?? 'replay'
  const loaded = await loadConfig({ root, configPath: args.config, profile: args.profile })
  const cfg = loaded.config

  const logger = new ExperimentLogger(cfg.experiment_log, resolveFromRoot(root, args.out ?? cfg.experiment_log.path))
  await logger.init()
  const sender = new SignalSender()
  const events: MonitorEvent[] = []
  const { manager } = createPipeline(cfg, {
    configHash: loaded.hash,
    emit: (e) => {
      logger.write(e)
      events.push(e)
    },
    sender
  })

  manager.registerSession(sessionId, 'ipc_push')
  let blocks = 0
  for (const file of files) {
    const records = readJsonlRecords(resolveFromRoot(root, file))
    for (const b of blocksFromRecords(records, sessionId, 'replay')) {
      manager.ingest(b)
      blocks += 1
    }
  }

  const snap = manager.getSnapshot(sessionId)
  if (!snap) {
    console.log('[replay] 无数据')
    return
  }
  const bands: Record<string, number> = {}
  for (const h of snap.history) bands[h.band] = (bands[h.band] ?? 0) + 1
  const triggers = events.filter((e) => e.type === 'intervention_triggered')

  console.log('\n======== replay 摘要 ========')
  console.log(`配置: ${loaded.sources.join(' + ')} (profile=${loaded.profileName}, hash=${loaded.hash})`)
  console.log(`块数: ${blocks} | 最终 phase: ${snap.phase} | L2 尝试: ${snap.l2Attempts}`)
  console.log(`波段分布: ${JSON.stringify(bands)}`)
  console.log(`干预: ${triggers.length} 次`)
  for (const t of triggers) {
    console.log(`  #${(t as { sequence: number }).sequence} ${(t as { level: string }).level}: ${(t as { reason: string }).reason}`)
  }
  console.log(`事件日志: ${resolveFromRoot(root, args.out ?? cfg.experiment_log.path)} (${events.length} 条)`)
  await logger.close()
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}

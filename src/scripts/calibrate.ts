#!/usr/bin/env node
/**
 * scripts/calibrate.ts — 参数网格扫描 + 离线校准
 * 目标函数: 翻转点召回率(recall)与误报(fp)的权衡
 * 输入 JSONL 需携带 label 字段('spec'|'mixed'|'react'), 由 demo/generate.ts 生成
 * 用法: node src/scripts/calibrate.ts --file demo-data/events.jsonl
 */

import { pathToFileURL } from 'node:url'
import { resolveProjectRoot, resolveFromRoot } from '../shared/paths.js'
import { loadConfig, deepMerge } from '../shared/config-loader.js'
import { createPipeline, readJsonlRecords, blocksFromRecords } from './pipeline.js'
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

interface Combo {
  name: string
  patch: Record<string, unknown>
}

const DETECT_WINDOW = 30

async function main(): Promise<void> {
  const root = resolveProjectRoot(import.meta.url)
  const args = parseArgs(process.argv.slice(2))
  const file = args.file ?? 'demo-data/events.jsonl'
  const sessionId = args.session ?? 'calibrate'
  const loaded = await loadConfig({ root, configPath: args.config, profile: args.profile })
  const baseCfg = loaded.config

  const records = readJsonlRecords(resolveFromRoot(root, file))
  const blocks = blocksFromRecords(records, sessionId, 'replay')
  // 块标签(与块一一对应)
  const labels: string[] = blocks.map((b, i) => {
    const rec = records[i] as Record<string, unknown> | undefined
    return typeof rec?.label === 'string' ? rec.label : 'unknown'
  })
  // 翻转点: label 从非 react 进入 react 的块下标
  const transitions: number[] = []
  for (let i = 1; i < labels.length; i++) {
    if (labels[i] === 'react' && labels[i - 1] !== 'react') transitions.push(i)
  }
  const specIdx = new Set<number>()
  labels.forEach((l, i) => {
    if (l === 'spec') specIdx.add(i)
  })
  console.log(`[calibrate] ${blocks.length} 块 | 翻转点 ${transitions.length} 个 @ ${transitions.join(',')} | spec 块 ${specIdx.size} 个\n`)

  const combos: Combo[] = []
  for (const size of [10, 20, 30]) {
    for (const gamma of [1.0, 1.5, 2.5]) {
      for (const k of [1.0, 1.5, 2.0]) {
        combos.push({
          name: `w${size} g${gamma} k${k}`,
          patch: {
            window: { size },
            scoring: { weights: { gamma } },
            threshold: {
              trigger: [
                { type: 'sigma', k, severity: 'warning' },
                { type: 'mixed_band', severity: 'warning' },
                { type: 'react_band', severity: 'critical' }
              ]
            }
          }
        })
      }
    }
  }

  interface Result {
    name: string
    recall: number
    fp: number
    latencyMs: number | null
    interventions: number
    objective: number
  }
  const results: Result[] = []

  for (const combo of combos) {
    const cfg = deepMerge(baseCfg, combo.patch)
    const sender = new SignalSender()
    const events: MonitorEvent[] = []
    const { manager } = createPipeline(cfg, {
      configHash: 'calibrate',
      emit: (e) => events.push(e),
      sender
    })
    manager.registerSession(sessionId, 'ipc_push')
    for (const b of blocks) manager.ingest(b)

    const triggers = events
      .filter((e) => e.type === 'intervention_triggered')
      .map((e) => e as MonitorEvent & { sequence: number })
      .sort((a, b) => a.sequence - b.sequence)

    // 检测: 翻转点后 DETECT_WINDOW 块内出现任意干预
    let detected = 0
    let latencySum = 0
    let latencyN = 0
    for (const t of transitions) {
      const hit = triggers.find((iv) => iv.sequence > t + 1 && iv.sequence <= t + DETECT_WINDOW)
      if (hit) {
        detected += 1
        latencySum += hit.sequence - t
        latencyN += 1
      }
    }
    // 误报: spec 段内出现的干预
    const fp = triggers.filter((iv) => {
      // 找到该 sequence 对应的块下标
      const idx = blocks.findIndex((b) => b.sequence === iv.sequence)
      return idx >= 0 && specIdx.has(idx)
    }).length

    const recall = transitions.length > 0 ? detected / transitions.length : 1
    const objective = recall * 2 - fp
    results.push({
      name: combo.name,
      recall,
      fp,
      latencyMs: latencyN > 0 ? latencySum / latencyN : null,
      interventions: triggers.length,
      objective
    })
  }

  results.sort((a, b) => b.objective - a.objective || a.fp - b.fp || a.recall - b.recall)
  console.log('排名  | 参数组合         | 召回率  | 误报 | 平均延迟(块) | 干预次数 | 目标分')
  console.log('------+------------------+---------+------+--------------+----------+-------')
  results.slice(0, 12).forEach((r, i) => {
    console.log(
      `  ${String(i + 1).padStart(2)}  | ${r.name.padEnd(16)} | ${(r.recall * 100).toFixed(0).padStart(5)}% | ${String(r.fp).padStart(4)} | ${r.latencyMs === null ? '     —' : String(r.latencyMs.toFixed(1)).padStart(10)} | ${String(r.interventions).padStart(8)} | ${r.objective.toFixed(1).padStart(5)}`
    )
  })
  const best = results[0]
  const [w, g, k] = best.name.split(' ').map((p) => p.slice(1))
  console.log('\n推荐参数(写入 profile):')
  console.log(`window:\n  size: ${w}\nscoring:\n  weights:\n    gamma: ${g}\nthreshold:\n  trigger:\n    - { type: sigma, k: ${k}, severity: warning }`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}

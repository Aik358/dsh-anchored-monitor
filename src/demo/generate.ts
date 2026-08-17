#!/usr/bin/env node
/**
 * demo/generate.ts — 生成合成会话事件流(JSONL), 用于演示完整闭环
 * 轨迹脚本: spec(锚定) → 漂移 → react(触发干预) → 恢复 → 再漂移 → 崩溃 → 重启后 spec
 * 记录携带 label 字段, 供 calibrate 离线校准使用
 */

import { writeFileSync } from 'node:fs'
import { ensureDir, resolveProjectRoot, resolveFromRoot } from '../shared/paths.js'
import { pathToFileURL } from 'node:url'

const SPEC = [
  'We will start by reviewing the repository structure, then we will plan the first change.',
  'We need to inspect the current implementation before deciding; our plan is to trace the data flow first.',
  'We will read the configuration and verify the assumptions together, then decide the next step.',
  'We should check how the pipeline assembles these events; our approach is to verify incrementally.',
  'We can compare these two options once we gather the evidence; let us document the tradeoffs.',
  'We will keep the change minimal and verify each step; our priority is correctness.',
  'We need to understand the failure mode before touching anything; we will list the hypotheses first.',
  'We will collect the relevant logs and cross-check the timeline; the evidence will guide us.',
  'We are going to validate the assumption with a small experiment; we will review the result together.',
  'We will document what we learn at each step so the next round starts from a known state.'
]

// mixed: we 与 let me 混合出现(过渡带指纹), 配比 2-3 we : 1 let me
// → persona_ratio ≈ 0.25-0.33, 落在 router-core 过渡带 [0.2, 0.5) 中部
const MIXED = [
  'We should check the current behavior, and we will verify the mismatch once we inspect it; let me look at the relevant lines first.',
  'We can read the file together, and we will compare both options before deciding; let me run the quick check now.',
  'We will verify the state first, and we need to keep the change minimal; let me confirm the details with a small test.',
  'We need to decide between two paths, and we will document the tradeoffs; let me try the first one and measure it.',
  'We will keep an eye on the logs, and we should review the diff after each step; let me apply the patch now.'
]

// react: let me 行动者指纹(与纠偏后的负向词典一致)
const REACT = [
  'Let me write the implementation directly and run it to see the output.',
  'Let me check the file quickly and patch the issue right away.',
  'Let me just replace that section and test it immediately.',
  'Let me open the editor and produce the fix now.',
  'Let me run the command and adjust based on the result.',
  'Let me push the change and iterate on whatever breaks next.',
  'Let me ship this version first and clean up later if needed.'
]

interface Segment { count: number; pool: string[]; label: 'spec' | 'mixed' | 'react' }

const SEGMENTS: Segment[] = [
  { count: 50, pool: SPEC, label: 'spec' },
  { count: 30, pool: MIXED, label: 'mixed' },
  { count: 40, pool: REACT, label: 'react' },
  { count: 30, pool: SPEC, label: 'spec' },   // 干预后恢复
  { count: 40, pool: MIXED, label: 'mixed' },
  { count: 30, pool: REACT, label: 'react' }, // 二次崩溃
  { count: 80, pool: SPEC, label: 'spec' }    // 重启后重新锚定
]

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
  const sessionId = args.session ?? 'demo-session'
  const out = resolveFromRoot(root, args.out ?? 'demo-data/events.jsonl')
  const base = Date.now() - SEGMENTS.reduce((s, seg) => s + seg.count, 0) * 1200

  const lines: string[] = []
  let seq = 0
  let pick = 0
  for (const seg of SEGMENTS) {
    for (let i = 0; i < seg.count; i++) {
      seq += 1
      pick = (pick + 7) % seg.pool.length
      const text = seg.pool[pick]
      lines.push(JSON.stringify({
        type: 'reasoning_block',
        sessionId,
        sequence: seq,
        timestamp: base + seq * 1200,
        label: seg.label,
        text
      }))
    }
  }
  ensureDir(out)
  writeFileSync(out, lines.join('\n') + '\n', 'utf8')
  console.log(`[demo:generate] ${seq} 个 reasoning 块 → ${out}`)
  console.log(`[demo:generate] 轨迹: spec(50) → mixed(30) → react(40) → spec(30) → mixed(40) → react(30) → spec(80)`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}

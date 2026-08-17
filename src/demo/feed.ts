#!/usr/bin/env node
/**
 * demo/feed.ts — 把生成的 JSONL 逐块 POST /api/push 投喂给运行中的监控进程(实时演示)
 * 用法: node src/demo/feed.ts [--url http://127.0.0.1:9301] [--file demo-data/events.jsonl] [--delay-ms 80]
 */

import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { resolveProjectRoot, resolveFromRoot } from '../shared/paths.js'

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
  const url = args.url ?? 'http://127.0.0.1:9301'
  const file = resolveFromRoot(root, args.file ?? 'demo-data/events.jsonl')
  const delayMs = Number(args['delay-ms'] ?? 80)
  const lines = readFileSync(file, 'utf8').split('\n').filter((l) => l.trim().length > 0)

  console.log(`[demo:feed] 目标 ${url} | 文件 ${file} | ${lines.length} 块 | 间隔 ${delayMs}ms\n`)
  let ok = 0
  for (let i = 0; i < lines.length; i++) {
    const rec = JSON.parse(lines[i]) as Record<string, unknown>
    const body = {
      sessionId: rec.sessionId,
      sequence: rec.sequence,
      text: rec.text,
      timestamp: Date.now()
    }
    const res = await fetch(url + '/api/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    if (res.ok) ok += 1
    if (i % 20 === 0) process.stdout.write(`\r[demo:feed] ${i + 1}/${lines.length}`)
    await new Promise((r) => setTimeout(r, delayMs))
  }
  process.stdout.write('\n')
  console.log(`[demo:feed] 完成: ${ok}/${lines.length} 块已投喂 (打开 ${url} 查看仪表盘)`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}

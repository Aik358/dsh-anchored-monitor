#!/usr/bin/env node
/**
 * scripts/build-preview.ts — 从运行中的监控进程抓取快照, 生成自包含预览 HTML
 * (内嵌 config/sessions/snapshot, 离线可渲染; 也用于仪表盘截图)
 * 用法: node dist/scripts/build-preview.js [--url http://127.0.0.1:9301] [--session id] [--out path]
 */

import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
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

interface SessionSummaryLike { sessionId: string }

async function main(): Promise<void> {
  const root = resolveProjectRoot(import.meta.url)
  const args = parseArgs(process.argv.slice(2))
  const base = args.url ?? 'http://127.0.0.1:9301'

  const [config, sessions] = await Promise.all([
    fetch(base + '/api/config').then((r) => r.json()),
    fetch(base + '/api/sessions').then((r) => r.json())
  ])
  const list = sessions as SessionSummaryLike[]
  const sel = args.session ?? list[0]?.sessionId ?? null
  const snapshot = sel
    ? await fetch(base + '/api/sessions/' + encodeURIComponent(sel)).then((r) => r.json())
    : null
  const embedded = { config, sessions: list, snapshot }

  const [html, css, js] = await Promise.all([
    readFile(join(root, 'web', 'index.html'), 'utf8'),
    readFile(join(root, 'web', 'styles.css'), 'utf8'),
    readFile(join(root, 'web', 'app.js'), 'utf8')
  ])
  // 防 </script> 逃逸
  const embedJson = JSON.stringify(embedded).replace(/</g, '\\u003c')
  const out = html
    .replace('<link rel="stylesheet" href="/styles.css">', '<style>\n' + css + '\n</style>')
    .replace('<script src="/app.js"></script>', '<script>window.EMBEDDED = ' + embedJson + ';</script>\n<script>\n' + js + '\n</script>')

  const outPath = resolveFromRoot(root, args.out ?? 'demo-data/preview.html')
  await writeFile(outPath, out, 'utf8')
  const histLen = (snapshot as { history?: unknown[] } | null)?.history?.length ?? 0
  console.log('preview →', outPath, '| session:', sel ?? '(none)', '| history:', histLen)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}

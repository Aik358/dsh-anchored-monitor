/**
 * 监控进程 HTTP 服务: REST API + SSE 实时流 + 仪表盘静态托管
 */

import { createServer, type IncomingMessage, type ServerResponse, type Server } from 'node:http'
import { readFile } from 'node:fs/promises'
import { closeSync, fstatSync, openSync, readSync } from 'node:fs'
import { extname, join } from 'node:path'
import type { InterventionSignal, MonitorConfig, MonitorEvent } from '../shared/types.js'
import type { SessionManager } from './session-manager.js'
import { IPC } from '../shared/ipc-protocol.js'

export interface MonitorServer {
  server: Server
  port: number
  url: string
  broadcast: (event: MonitorEvent | InterventionSignal) => void
}

export interface StartServerOptions {
  config: MonitorConfig
  configHash: string
  manager: SessionManager
  root: string
  /** 实验日志 JSONL 的绝对路径(供 /api/events 尾读) */
  logPath: string
  /** 日志型事件源注册回调(由入口装配) */
  registerSource?: (sessionId: string, logPath?: string) => Promise<void>
  onLog?: (message: string) => void
}

interface SseClient {
  res: ServerResponse
  sessionId: string | null
}

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png'
}

const STATIC_FILES: Record<string, string> = {
  '/': 'index.html',
  '/index.html': 'index.html',
  '/styles.css': 'styles.css',
  '/app.js': 'app.js',
  '/favicon.svg': 'favicon.svg'
}

function setCors(res: ServerResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

function json(res: ServerResponse, code: number, payload: unknown): void {
  const body = JSON.stringify(payload)
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(body)
}

/** 尾读 JSONL 文件(最多读尾部 maxBytes 字节), 返回最近若干事件 */
function readTailJsonl(filePath: string, maxBytes = 512 * 1024): unknown[] {
  try {
    const fd = openSync(filePath, 'r')
    try {
      const size = fstatSync(fd).size
      const start = Math.max(0, size - maxBytes)
      const buf = Buffer.alloc(size - start)
      readSync(fd, buf, 0, buf.length, start)
      const lines = buf.toString('utf8').split('\n').filter((l) => l.trim().length > 0)
      const tail = lines.slice(-400)
      const out: unknown[] = []
      for (const line of tail) {
        try {
          out.push(JSON.parse(line) as unknown)
        } catch {
          // 跳过损坏行
        }
      }
      return out
    } finally {
      closeSync(fd)
    }
  } catch {
    return []
  }
}

function readJsonBody(req: IncomingMessage, limitBytes: number): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let size = 0
    req.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size > limitBytes) {
        reject(new Error('body too large'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      try {
        const text = Buffer.concat(chunks).toString('utf8')
        const parsed = text.length === 0 ? {} : (JSON.parse(text) as unknown)
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
          reject(new Error('body must be a JSON object'))
          return
        }
        resolve(parsed as Record<string, unknown>)
      } catch (err) {
        reject(err instanceof Error ? err : new Error('invalid JSON'))
      }
    })
    req.on('error', reject)
  })
}

export async function startServer(opts: StartServerOptions): Promise<MonitorServer> {
  const clients = new Set<SseClient>()
  const webRoot = join(opts.root, opts.config.dashboard.web_root.replace(/^\.\//, ''))
  let broadcast: MonitorServer['broadcast'] = () => {}

  const server = createServer((req, res) => {
    setCors(res)
    if (req.method === 'OPTIONS') {
      res.writeHead(204)
      res.end()
      return
    }
    const url = new URL(req.url ?? '/', 'http://localhost')
    const path = url.pathname
    void (async () => {
      try {
        if (path === '/api/health' && req.method === 'GET') {
          return json(res, 200, {
            ok: true,
            uptimeMs: Math.round(process.uptime() * 1000),
            version: opts.config.version,
            sessions: opts.manager.listSummaries().length
          })
        }
        if (path === '/api/shutdown' && req.method === 'POST') {
          const address = req.socket.remoteAddress ?? ''
          if (address !== '127.0.0.1' && address !== '::1' && address !== '::ffff:127.0.0.1') {
            return json(res, 403, { ok: false, error: 'loopback-only' })
          }
          json(res, 200, { ok: true })
          setTimeout(() => process.exit(0), 150)
          return
        }
        if (path === '/api/config' && req.method === 'GET') {
          return json(res, 200, opts.config)
        }
        if (path === '/api/intervention' && req.method === 'GET') {
          return json(res, 200, { ok: true, enabled: opts.manager.isInterventionsEnabled() })
        }
        if (path === '/api/intervention' && req.method === 'POST') {
          const body = await readJsonBody(req, 1024 * 16)
          if (!body || typeof body.enabled !== 'boolean') {
            return json(res, 400, { ok: false, error: '需要 { enabled: boolean }' })
          }
          opts.manager.setInterventionsEnabled(body.enabled)
          return json(res, 200, { ok: true, enabled: opts.manager.isInterventionsEnabled() })
        }
        if (path === '/api/sessions' && req.method === 'GET') {
          return json(res, 200, opts.manager.listSummaries())
        }
        if (path === '/api/events' && req.method === 'GET') {
          const sessionFilter = url.searchParams.get('sessionId')
          const limit = Math.min(200, Math.max(1, Number(url.searchParams.get('limit') ?? 50) || 50))
          const all = readTailJsonl(opts.logPath) as Array<{ sessionId?: string }>
          const filtered = sessionFilter ? all.filter((e) => e.sessionId === sessionFilter) : all
          return json(res, 200, filtered.slice(-limit))
        }
        if (path === '/api/overview' && req.method === 'GET') {
          const summaries = opts.manager.listSummaries()
          const requested = url.searchParams.get('sessionId')
          const sessionId = requested ?? summaries[0]?.sessionId ?? null
          const snapshot = sessionId ? opts.manager.getSnapshot(sessionId) : null
          const limit = Math.min(60, Math.max(1, Number(url.searchParams.get('limit') ?? 30) || 30))
          const all = readTailJsonl(opts.logPath) as Array<{ sessionId?: string }>
          const events = (sessionId ? all.filter((e) => e.sessionId === sessionId) : all).slice(-limit)
          return json(res, 200, {
            ok: true,
            monitorOnline: true,
            version: opts.config.version,
            configHash: opts.configHash,
            bands: opts.config.bands,
            thresholds: {
              specMax: opts.config.bands.spec_max,
              reactMin: opts.config.bands.react_min,
              safetyFloor: opts.config.threshold.safety_floor
            },
            triggers: {
              mixed: opts.config.threshold.trigger.some((r) => r.type === 'mixed_band'),
              react: opts.config.threshold.trigger.some((r) => r.type === 'react_band'),
              sigma: opts.config.threshold.trigger.some((r) => r.type === 'sigma'),
              percentile: opts.config.threshold.trigger.some((r) => r.type === 'percentile'),
              floor: opts.config.threshold.trigger.some((r) => r.type === 'safety_floor')
            },
            cooldowns: opts.config.intervention.cooldowns,
            maxL2Attempts: opts.config.intervention.max_L2_attempts,
            bootstrapTools: opts.config.intervention.bootstrap_tools,
            interventionsEnabled: opts.manager.isInterventionsEnabled(),
            sessions: summaries,
            selected: sessionId,
            snapshot,
            events
          })
        }
        if (path === '/api/stream' && req.method === 'GET') {
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive'
          })
          const client: SseClient = { res, sessionId: url.searchParams.get('sessionId') }
          clients.add(client)
          res.write(`data: ${JSON.stringify({ type: 'stream_ready', timestamp: Date.now() })}\n\n`)
          const ping = setInterval(() => {
            try {
              res.write(': ping\n\n')
            } catch {
              clearInterval(ping)
            }
          }, 15000)
          req.on('close', () => {
            clearInterval(ping)
            clients.delete(client)
          })
          return
        }
        if (path === '/api/push' && req.method === 'POST') {
          const body = await readJsonBody(req, 1024 * 1024)
          const sessionId = body.sessionId
          const text = body.text
          if (typeof sessionId !== 'string' || sessionId.length === 0 || typeof text !== 'string') {
            return json(res, 400, { ok: false, error: 'push 需要 { sessionId: string, text: string }' })
          }
          const block = {
            sessionId,
            text,
            sequence: typeof body.sequence === 'number' ? body.sequence : 0,
            timestamp: typeof body.timestamp === 'number' ? body.timestamp : Date.now(),
            source: 'ipc' as const
          }
          opts.manager.ingest(block)
          return json(res, 200, { ok: true, sessionId })
        }
        const sessionMatch = path.match(/^\/api\/sessions\/([^/]+)$/)
        if (sessionMatch && req.method === 'GET') {
          const snap = opts.manager.getSnapshot(decodeURIComponent(sessionMatch[1]))
          if (!snap) return json(res, 404, { ok: false, error: 'session not found' })
          return json(res, 200, snap)
        }
        const registerMatch = path.match(/^\/api\/sessions\/([^/]+)\/register$/)
        if (registerMatch && req.method === 'POST') {
          const sessionId = decodeURIComponent(registerMatch[1])
          const body = await readJsonBody(req, 1024 * 1024)
          const logPath = typeof body.logPath === 'string' ? body.logPath : undefined
          opts.manager.registerSession(sessionId, 'log_tail')
          await opts.registerSource?.(sessionId, logPath)
          return json(res, 200, { ok: true, sessionId })
        }
        const ackMatch = path.match(/^\/api\/sessions\/([^/]+)\/ack$/)
        if (ackMatch && req.method === 'POST') {
          const sessionId = decodeURIComponent(ackMatch[1])
          const body = await readJsonBody(req, 1024 * 1024)
          const level = body.level
          if (level !== 'L1' && level !== 'L2' && level !== 'L3') {
            return json(res, 400, { ok: false, error: 'level 必须是 L1/L2/L3' })
          }
          const ok = opts.manager.ack(sessionId, level, typeof body.status === 'string' ? body.status : 'executed')
          return json(res, ok ? 200 : 404, { ok })
        }
        const resetMatch = path.match(/^\/api\/sessions\/([^/]+)\/reset$/)
        if (resetMatch && req.method === 'POST') {
          const signal = opts.manager.forceReset(decodeURIComponent(resetMatch[1]))
          if (!signal) return json(res, 404, { ok: false, error: 'session not found' })
          return json(res, 200, { ok: true, signal })
        }
        const staticFile = STATIC_FILES[path]
        if (staticFile && req.method === 'GET') {
          try {
            const data = await readFile(join(webRoot, staticFile))
            res.writeHead(200, { 'Content-Type': MIME[extname(staticFile)] ?? 'application/octet-stream' })
            res.end(data)
          } catch {
            res.writeHead(404)
            res.end('not found')
          }
          return
        }
        res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' })
        res.end(JSON.stringify({ ok: false, error: 'not found' }))
      } catch (err) {
        json(res, 500, { ok: false, error: err instanceof Error ? err.message : String(err) })
      }
    })()
  })

  broadcast = (event) => {
    const line = `data: ${JSON.stringify(event)}\n\n`
    for (const client of clients) {
      if (client.sessionId !== null && client.sessionId !== (event as { sessionId?: string }).sessionId) continue
      try {
        client.res.write(line)
      } catch {
        clients.delete(client)
      }
    }
  }

  const port = opts.config.dashboard.port
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(port, opts.config.dashboard.host, () => resolve())
  })
  const url = `http://${opts.config.dashboard.host}:${port}`
  opts.onLog?.(`仪表盘: ${url}`)
  return { server, port, url, broadcast }
}

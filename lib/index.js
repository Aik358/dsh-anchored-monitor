/**
 * @a9i5k4/dsh-anchored-monitor — host half(零运行时依赖, 仅 node 内置模块)。
 *
 * 职责:
 *  1. 自动拉起独立监控进程(autoStart, 默认开): DSH 启动即检测/拉起
 *     node <pkg>/dist/monitor/index.js --profile <profile> --overrides <json>,
 *     15s watchdog 保活; 用户零操作。
 *  2. 真实会话监控: 监听 'session/event', 把每个 assistant/message 的
 *     reasoning 块 POST /api/push 推给监控进程(所有会话自动覆盖)。
 *  3. 真实干预: 轮询监控进程事件流, 检测到 L1/L2/L3 后执行——
 *     L1: agent/pre-step 注入建议式提示消息; L2: system-prompt/assemble
 *     替换 persona 段为 Minimal 46 字符句 + 工具目录收缩为 bootstrap 双工具;
 *     L3: 注入建议重启的消息; 执行后回 ack。
 *  4. 设置面: /api/anchored-monitor/settings GET/POST 读写宿主配置与
 *     监控 overrides(保存后自动重启监控进程生效)。
 *  5. /api/anchored-monitor/* 同源代理(loopback-only) + 系统提示词宣发段。
 */

import { spawn } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** Stable cordis plugin name(与 cordis.patch.yml insert id 一致)。 */
export const name = 'anchored-monitor'

/** 挂载所需服务。 */
export const inject = ['webServer', 'systemPrompt']

const SECTION_ORDER = 210
const API_PREFIX = '/api/anchored-monitor'
const DEFAULT_MONITOR_URL = 'http://127.0.0.1:9301'
const PACKAGE_ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const MONITOR_ENTRY = path.join(PACKAGE_ROOT, 'dist', 'monitor', 'index.js')

function homeFile(...parts) {
  return path.join(homedir(), '.dsh', ...parts)
}
function configPath() {
  return homeFile('anchored-monitor.json')
}
function overridesPath() {
  return homeFile('anchored-monitor.overrides.json')
}

/** Model-facing announcement。 */
export const GUIDANCE = '本机已安装 dsh-anchored-monitor 插件（实时思维链锚定监控与干预）：DSH 启动时自动拉起独立监控进程，按 we/let\'s/let me 指纹持续评估每个会话思维链所处波段（spec 稳定带 <0.2 / mixed 过渡带 0.2-0.5 / react 行动者带 >=0.5）。GUI 左侧栏「锚定监控」入口可打开液体毛玻璃浮层面板查看实时波段/强度分/趋势与干预级联，收起时以变阻器式悬浮条显示思考强度与最近日志；设置页可调整全部技术参数（窗口/词典/评分权重/波段边界/阈值/冷却/提示模板/日志）。干预自动执行：L1 温和引导（建议式措辞注入下一轮，禁止命令式）/ L2 强制重置（persona 切回 Minimal 46 字符句 + bash/str_replace_editor 双工具，监控窗口与基线清零）/ L3 建议会话重启。用户提到「锚定监控 / 思维链监控 / 波段 / 思考强度」时即指本插件，请据此协作。'

function isLoopbackRequest(req) {
  const address = req && req.socket && req.socket.remoteAddress ? req.socket.remoteAddress : ''
  if (address !== '127.0.0.1' && address !== '::1' && address !== '::ffff:127.0.0.1') return false
  const host = req && req.headers && req.headers.host ? req.headers.host : ''
  const hostname = host.split(':')[0]
  return hostname === '127.0.0.1' || hostname === 'localhost' || hostname === '[::1]'
}

function writeJson(res, code, payload) {
  const body = JSON.stringify(payload)
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8' })
  res.end(body)
}

async function readJsonBody(req) {
  const chunks = []
  let total = 0
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    chunks.push(buffer)
    total += buffer.length
    if (total > 256 * 1024) return null
  }
  const text = Buffer.concat(chunks).toString('utf8')
  if (text === '') return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

/** 把请求原样转发到监控进程(带 2.5s 超时); 离线时返回 502 + 提示。 */
async function proxyGet(monitorUrl, req, res, monitorPath) {
  try {
    const qIndex = (req.url || '').indexOf('?')
    const query = qIndex >= 0 ? req.url.slice(qIndex) : ''
    const upstream = await fetch(monitorUrl + monitorPath + query, { signal: AbortSignal.timeout(2500) })
    const body = await upstream.text()
    res.writeHead(upstream.status, { 'content-type': 'application/json; charset=utf-8' })
    res.end(body)
  } catch (err) {
    writeJson(res, 502, {
      ok: false,
      monitorOnline: false,
      error: 'monitor-offline',
      hint: '监控进程离线(正在自动拉起, 请稍候)',
      detail: String(err && err.message ? err.message : err)
    })
  }
}

export function apply(ctx) {
  let config = { monitorUrl: DEFAULT_MONITOR_URL, enabled: true, autoStart: true, profile: 'demo', monitorOverrides: {} }
  const reload = async () => {
    let parsed = {}
    try {
      parsed = JSON.parse(await readFile(configPath(), 'utf8'))
    } catch {
      parsed = {}
    }
    config = {
      monitorUrl: typeof parsed.monitorUrl === 'string' && parsed.monitorUrl !== '' ? parsed.monitorUrl : (process.env.ANCHORED_MONITOR_URL || DEFAULT_MONITOR_URL),
      enabled: parsed.enabled !== false,
      autoStart: parsed.autoStart !== false,
      profile: typeof parsed.profile === 'string' && parsed.profile !== '' ? parsed.profile : 'demo',
      monitorOverrides: parsed.monitorOverrides && typeof parsed.monitorOverrides === 'object' ? parsed.monitorOverrides : {}
    }
  }

  const warned = new Set()
  const warnOnce = (message) => {
    if (warned.has(message)) return
    warned.add(message)
    try {
      ctx.logger.warn(message)
    } catch {
      // logger 不可用时仅避免刷屏
    }
  }

  // ── 1) 监控进程生命周期: 自动拉起 + watchdog ──
  let monitorProc = null
  let monitorBusy = false
  const isMonitorOnline = async (url) => {
    try {
      const r = await fetch(url + '/api/health', { signal: AbortSignal.timeout(1500) })
      return r.ok
    } catch {
      return false
    }
  }
  const ensureMonitorRunning = async () => {
    if (monitorBusy) return
    monitorBusy = true
    try {
      if (!config.enabled || !config.autoStart) return
      if (await isMonitorOnline(config.monitorUrl)) return
      try {
        await mkdir(homeFile(), { recursive: true })
        await writeFile(overridesPath(), JSON.stringify(config.monitorOverrides ?? {}, null, 2), 'utf8')
      } catch (err) {
        warnOnce('anchored-monitor: overrides 文件写入失败: ' + String(err && err.message ? err.message : err))
      }
      monitorProc = spawn(process.execPath, [MONITOR_ENTRY, '--profile', config.profile, '--overrides', overridesPath()], {
        detached: true,
        stdio: 'ignore',
        windowsHide: true,
        cwd: PACKAGE_ROOT
      })
      monitorProc.unref()
      for (let i = 0; i < 12; i++) {
        await new Promise((r) => setTimeout(r, 500))
        if (await isMonitorOnline(config.monitorUrl)) return
      }
      warnOnce('anchored-monitor: 监控进程已拉起但未就绪: ' + config.monitorUrl)
    } finally {
      monitorBusy = false
    }
  }

  // ── 2) 真实会话 reasoning 推送 ──
  const seqBySession = new Map()
  const reasoningOf = (event) => {
    const content = event && event.data && event.data.message && event.data.message.content
    if (!Array.isArray(content)) return null
    const parts = content
      .filter((c) => c && (c.type === 'reasoning' || c.type === 'thinking') && typeof c.text === 'string')
      .map((c) => c.text)
    return parts.length > 0 ? parts.join('\n') : null
  }
  const pushReasoning = async (sessionId, text) => {
    if (!config.enabled) return
    const seq = (seqBySession.get(sessionId) ?? 0) + 1
    seqBySession.set(sessionId, seq)
    try {
      await fetch(config.monitorUrl + '/api/push', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ type: 'reasoning_block', sessionId, sequence: seq, text, timestamp: Date.now() })
      })
    } catch {
      // 离线时丢弃(监控进程就绪后继续); 每块最多丢一次
    }
  }
  ctx.on('session/event', (session, event) => {
    if (!session || event?.type !== 'assistant/message') return
    const text = reasoningOf(event)
    if (text) void pushReasoning(session.id, text)
  })

  // ── 3) 干预执行(L1 提示 / L2 重置 / L3 重启建议) ──
  const pendingHints = new Map()
  const pendingResets = new Map()
  const knownSessions = new Set()
  const handledSeq = new Map()

  const ackSignal = (signal, status) => {
    void fetch(config.monitorUrl + '/api/sessions/' + encodeURIComponent(signal.sessionId) + '/ack', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'ack', sessionId: signal.sessionId, level: signal.level, status, timestamp: Date.now() })
    }).catch(() => {})
  }
  const executeSignal = (signal) => {
    try {
      if (signal.level === 'L1') {
        pendingHints.set(signal.sessionId, signal.payload && signal.payload.hintText ? signal.payload.hintText : '')
        ackSignal(signal, 'executed')
      } else if (signal.level === 'L2') {
        pendingResets.set(signal.sessionId, (signal.payload && signal.payload.reset) || { systemPrompt: '', tools: [] })
        ackSignal(signal, 'executed')
      } else if (signal.level === 'L3') {
        pendingHints.set(signal.sessionId, 'The monitoring system recommends restarting this session: ' + (signal.reason || 'trajectory left the spec band'))
        ackSignal(signal, 'executed')
      }
    } catch (err) {
      ackSignal(signal, 'failed: ' + String(err && err.message ? err.message : err))
    }
  }
  const pollInterventions = async () => {
    if (!config.enabled) return
    let events = []
    try {
      const res = await fetch(config.monitorUrl + '/api/events?limit=60', { signal: AbortSignal.timeout(2500) })
      if (!res.ok) return
      events = await res.json()
    } catch {
      return
    }
    if (!Array.isArray(events)) return
    // 基线: 已知会话之外的会话, 以当前批次最大干预序号为准, 不重放历史干预
    const batch = new Map()
    for (const e of events) {
      if (e.type === 'intervention_triggered' && e.sessionId) {
        batch.set(e.sessionId, Math.max(batch.get(e.sessionId) ?? 0, e.sequence))
      }
    }
    for (const [sessionId, maxSeq] of batch) {
      if (!knownSessions.has(sessionId)) {
        knownSessions.add(sessionId)
        handledSeq.set(sessionId, maxSeq)
      }
    }
    for (const e of events) {
      if (e.type !== 'intervention_triggered' || !e.sessionId) continue
      if (e.sequence > (handledSeq.get(e.sessionId) ?? 0)) {
        handledSeq.set(e.sessionId, e.sequence)
        executeSignal(e)
      }
    }
  }

  // L1/L3: 提示注入(instruction-hint 注入模式; 必须调用 next())
  ctx.on('agent/pre-step', async ({ agent, signal }, next) => {
    const decision = await next()
    try {
      const session = agent && agent.session
      if (!session) return decision
      const hint = pendingHints.get(session.id)
      if (hint === undefined) return decision
      pendingHints.delete(session.id)
      return {
        ...decision,
        messages: [...(decision.messages ?? []), {
          id: 'anchored-monitor-hint-' + session.id,
          role: 'user',
          content: [{ type: 'text', text: hint }],
          source: { kind: 'anchored-monitor', form: 'hint' }
        }]
      }
    } catch (err) {
      warnOnce('anchored-monitor: 提示注入失败: ' + String(err && err.message ? err.message : err))
      return decision
    }
  }, { prepend: true })

  // L2: persona 段替换 + 工具目录收缩(router-core.applyPersona + tool-bootstrap 模式)
  ctx.on('system-prompt/assemble', async (_assembly, context, next) => {
    const assembled = await next()
    try {
      const session = context && context.agent && context.agent.session
      if (!session) return assembled
      const reset = pendingResets.get(session.id)
      if (!reset) return assembled
      pendingResets.delete(session.id)
      const sections = (assembled.sections ?? []).filter((s) => s.name !== 'persona' && !/persona/i.test(s.name))
      sections.push({ name: 'anchored-monitor-persona', text: reset.systemPrompt ?? '', order: 0 })
      const keep = new Set(reset.tools ?? [])
      const tools = Array.isArray(assembled.tools) ? assembled.tools.filter((t) => keep.has(t.name)) : assembled.tools
      return { ...assembled, sections, tools }
    } catch (err) {
      // 过滤失败退化为完整目录, 绝不 brick 会话
      warnOnce('anchored-monitor: 重置注入失败: ' + String(err && err.message ? err.message : err))
      return assembled
    }
  })

  // ── 4) 路由 + 生命周期 ──
  ctx.effect(() => {
    void (async () => {
      await reload()
      void ensureMonitorRunning()
    })()
    const watchdog = setInterval(() => void ensureMonitorRunning(), 15000)
    const pollTimer = setInterval(() => void pollInterventions(), 1500)

    const disposers = []
    const guard = (req, res) => {
      if (!isLoopbackRequest(req)) {
        writeJson(res, 403, { error: 'forbidden: loopback-only' })
        return false
      }
      return true
    }
    const routes = [
      {
        kind: 'exact',
        path: API_PREFIX + '/status',
        handler: async (req, res) => {
          if (!guard(req, res)) return
          if ((req.method || 'GET') !== 'GET') return writeJson(res, 405, { error: 'method not allowed' })
          await reload()
          const online = await isMonitorOnline(config.monitorUrl)
          let version = null
          if (online) {
            try {
              version = (await (await fetch(config.monitorUrl + '/api/health', { signal: AbortSignal.timeout(1500) })).json()).version ?? null
            } catch {
              // 忽略
            }
          }
          writeJson(res, 200, { ok: true, enabled: config.enabled, autoStart: config.autoStart, monitorUrl: config.monitorUrl, profile: config.profile, monitorOnline: online, version })
        }
      },
      {
        kind: 'exact',
        path: API_PREFIX + '/config',
        handler: async (req, res) => {
          if (!guard(req, res)) return
          if (req.method === 'GET') {
            await reload()
            return writeJson(res, 200, { ok: true, ...config })
          }
          if (req.method === 'POST') {
            const payload = await readJsonBody(req)
            if (!payload || typeof payload !== 'object') return writeJson(res, 400, { ok: false, error: 'invalid JSON body' })
            const next = { ...config }
            if (typeof payload.monitorUrl === 'string' && /^https?:\/\//.test(payload.monitorUrl)) next.monitorUrl = payload.monitorUrl
            if (typeof payload.enabled === 'boolean') next.enabled = payload.enabled
            if (typeof payload.autoStart === 'boolean') next.autoStart = payload.autoStart
            if (typeof payload.profile === 'string' && payload.profile !== '') next.profile = payload.profile
            if (payload.monitorOverrides && typeof payload.monitorOverrides === 'object') next.monitorOverrides = payload.monitorOverrides
            try {
              await mkdir(homeFile(), { recursive: true })
              await writeFile(configPath(), JSON.stringify(next, null, 2), 'utf8')
            } catch (err) {
              return writeJson(res, 500, { ok: false, error: 'config write failed: ' + String(err && err.message ? err.message : err) })
            }
            config = next
            return writeJson(res, 200, { ok: true, ...config })
          }
          return writeJson(res, 405, { ok: false, error: 'method not allowed' })
        }
      },
      {
        kind: 'exact',
        path: API_PREFIX + '/settings',
        handler: async (req, res) => {
          if (!guard(req, res)) return
          if (req.method === 'GET') {
            await reload()
            const online = await isMonitorOnline(config.monitorUrl)
            let effective = null
            if (online) {
              try {
                effective = await (await fetch(config.monitorUrl + '/api/config', { signal: AbortSignal.timeout(2000) })).json()
              } catch {
                effective = null
              }
            }
            return writeJson(res, 200, { ok: true, host: config, monitorOnline: online, effective })
          }
          if (req.method === 'POST') {
            const payload = await readJsonBody(req)
            if (!payload || typeof payload !== 'object') return writeJson(res, 400, { ok: false, error: 'invalid JSON body' })
            const next = { ...config }
            const hostPatch = payload.host
            if (hostPatch && typeof hostPatch === 'object') {
              if (typeof hostPatch.monitorUrl === 'string' && /^https?:\/\//.test(hostPatch.monitorUrl)) next.monitorUrl = hostPatch.monitorUrl
              if (typeof hostPatch.enabled === 'boolean') next.enabled = hostPatch.enabled
              if (typeof hostPatch.autoStart === 'boolean') next.autoStart = hostPatch.autoStart
              if (typeof hostPatch.profile === 'string' && hostPatch.profile !== '') next.profile = hostPatch.profile
            }
            const overridesPatch = payload.overrides
            if (overridesPatch && typeof overridesPatch === 'object') {
              next.monitorOverrides = { ...next.monitorOverrides, ...overridesPatch }
            }
            // 端口联动: overrides.dashboard.port 变更时同步 monitorUrl
            const port = next.monitorOverrides.dashboard && next.monitorOverrides.dashboard.port
            if (typeof port === 'number' && port > 0) {
              next.monitorUrl = 'http://127.0.0.1:' + port
            }
            try {
              await mkdir(homeFile(), { recursive: true })
              await writeFile(configPath(), JSON.stringify(next, null, 2), 'utf8')
              await writeFile(overridesPath(), JSON.stringify(next.monitorOverrides ?? {}, null, 2), 'utf8')
            } catch (err) {
              return writeJson(res, 500, { ok: false, error: 'config write failed: ' + String(err && err.message ? err.message : err) })
            }
            config = next
            // 重启监控进程使新参数生效
            let restarted = false
            try {
              await fetch(config.monitorUrl + '/api/shutdown', { method: 'POST', signal: AbortSignal.timeout(1500) })
              restarted = true
            } catch {
              // 本来就没在线
            }
            await new Promise((r) => setTimeout(r, 700))
            await ensureMonitorRunning()
            const online = await isMonitorOnline(config.monitorUrl)
            return writeJson(res, 200, { ok: true, saved: true, restarted, monitorOnline: online, host: config })
          }
          return writeJson(res, 405, { ok: false, error: 'method not allowed' })
        }
      },
      {
        kind: 'exact',
        path: API_PREFIX + '/overview',
        handler: async (req, res) => {
          if (!guard(req, res)) return
          if ((req.method || 'GET') !== 'GET') return writeJson(res, 405, { error: 'method not allowed' })
          if (!config.enabled) return writeJson(res, 200, { ok: false, enabled: false, monitorOnline: false, error: 'plugin-disabled' })
          return proxyGet(config.monitorUrl, req, res, '/api/overview')
        }
      },
      {
        kind: 'exact',
        path: API_PREFIX + '/sessions',
        handler: async (req, res) => {
          if (!guard(req, res)) return
          if ((req.method || 'GET') !== 'GET') return writeJson(res, 405, { error: 'method not allowed' })
          if (!config.enabled) return writeJson(res, 200, { ok: false, enabled: false, error: 'plugin-disabled' })
          return proxyGet(config.monitorUrl, req, res, '/api/sessions')
        }
      },
      {
        kind: 'exact',
        path: API_PREFIX + '/events',
        handler: async (req, res) => {
          if (!guard(req, res)) return
          if ((req.method || 'GET') !== 'GET') return writeJson(res, 405, { error: 'method not allowed' })
          if (!config.enabled) return writeJson(res, 200, { ok: false, enabled: false, error: 'plugin-disabled' })
          return proxyGet(config.monitorUrl, req, res, '/api/events')
        }
      },
      {
        kind: 'prefix',
        path: API_PREFIX + '/sessions/',
        handler: async (req, res) => {
          if (!guard(req, res)) return
          if ((req.method || 'GET') !== 'GET') return writeJson(res, 405, { error: 'method not allowed' })
          if (!config.enabled) return writeJson(res, 200, { ok: false, enabled: false, error: 'plugin-disabled' })
          const pathname = new URL(req.url || '/', 'http://localhost').pathname
          return proxyGet(config.monitorUrl, req, res, pathname.slice(API_PREFIX.length))
        }
      }
    ]
    for (const route of routes) disposers.push(ctx.webServer.register(route))
    disposers.push(ctx.systemPrompt.section({ name: 'plugin:anchored-monitor', order: SECTION_ORDER, text: GUIDANCE }))
    return () => {
      clearInterval(watchdog)
      clearInterval(pollTimer)
      for (const dispose of disposers) {
        try {
          dispose()
        } catch {
          // 卸载失败不阻塞
        }
      }
      if (monitorProc) {
        try {
          monitorProc.kill()
        } catch {
          // 已退出
        }
        monitorProc = null
      }
    }
  }, 'dsh-anchored-monitor: host monitor lifecycle + proxy + interventions')
}

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

/** 挂载所需服务(agents 用于干预后自动续跑 followup)。 */
export const inject = ['webServer', 'systemPrompt', 'agents']

const SECTION_ORDER = 210
const API_PREFIX = '/api/anchored-monitor'
const DEFAULT_MONITOR_URL = 'http://127.0.0.1:9301'
const UPDATE_RAW_URL = 'https://raw.githubusercontent.com/Aik358/dsh-anchored-monitor/main/package.json'
const UPDATE_TTL_MS = 12 * 3600 * 1000
let updateCache = null
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
export const GUIDANCE = '本机已安装 dsh-anchored-monitor 插件（实时思维链锚定监控与干预）：DSH 启动时自动拉起独立监控进程，按 we/let\'s/let me 指纹持续评估每个会话思维链所处波段（spec 稳定带 <0.2 / mixed 过渡带 0.2-0.5 / react 行动者带 >=0.5）。GUI 左侧栏「锚定监控」入口可打开液体毛玻璃浮层面板查看实时波段/强度分/趋势与干预级联，收起时以变阻器式悬浮条显示思考强度与最近日志（可选「滑动变祖器」梗皮肤：小方块按强度从夯到拉切换梁文锋表情）；设置页可调整全部技术参数（窗口/词典/评分权重/波段边界/阈值/冷却/提示模板/日志）与皮肤。干预自动执行：L1 温和引导（建议式措辞注入下一轮，禁止命令式）/ L2 强制重置（persona 切回 Minimal 46 字符句 + bash/str_replace_editor 双工具，监控窗口与基线清零）/ L3 建议会话重启。用户提到「锚定监控 / 思维链监控 / 波段 / 思考强度」时即指本插件，请据此协作。'

function semverGt(a, b) {
  const pa = String(a).split('.').map(function (x) { return Number(x) || 0 })
  const pb = String(b).split('.').map(function (x) { return Number(x) || 0 })
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) > (pb[i] || 0)
  }
  return false
}

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
  // 流式增量推送: 订阅 llm/stream 的 reasoning-delta, 按 ~1s 节流把增量实时推给监控进程——
  // 图表/变阻器条在模型推理过程中就能连续跳动, 不必等整轮结束。
  // 计数线性可加, 增量切块与整块推送在窗口聚合上完全等价。
  const STREAM_THROTTLE_MS = 1000
  const streamBuffers = new Map() // sessionId → { text, last, active }
  ctx.on('llm/stream', (options, next) => {
    const sessionId = options && typeof options.sessionId === 'string' ? options.sessionId : undefined
    if (!sessionId || !config.enabled) return next()
    // 规矩(2026-08-18 事故后立下):
    //   llm/stream 是"流透传"waterfall —— 链上前面的监听器会直接迭代本监听器的返回值。
    //   ①生产方(本文件): 监听器必须是普通函数, 返回 async generator; 禁止 async 函数
    //     (async 会把 generator 包成 Promise, 上游 for await 迭代时抛
    //     "next(...) is not a function or its return value is not async iterable")。
    //   ②消费方(所有插件): 一律 for await (const c of await next()) —— 先 await 再迭代,
    //     下游返回 Promise 或流都能安全透传(dsh-draw-gacha 已加该防御)。
    //   agent/pre-step、system-prompt/assemble 属"值传递"事件, async + await next() 是安全的。
    return (async function* () {
      for await (const chunk of next()) {
        yield chunk
        if (!chunk || chunk.type !== 'reasoning-delta' || typeof chunk.text !== 'string' || chunk.text === '') continue
        let buf = streamBuffers.get(sessionId)
        if (!buf) {
          buf = { text: '', last: 0, active: true }
          streamBuffers.set(sessionId, buf)
        }
        buf.text += chunk.text
        buf.active = true
        const now = Date.now()
        if (now - buf.last >= STREAM_THROTTLE_MS) {
          buf.last = now
          const delta = buf.text
          buf.text = ''
          void pushReasoning(sessionId, delta)
        }
      }
    })()
  })
  ctx.on('session/event', (session, event) => {
    if (!session || event?.type !== 'assistant/message') return
    // 若本轮已通过流式增量推送, 只冲掉尾部残留; 否则整段推送(适配器无 reasoning-delta 时兜底)
    const buf = streamBuffers.get(session.id)
    if (buf && buf.active) {
      if (buf.text) void pushReasoning(session.id, buf.text)
      buf.text = ''
      buf.active = false
      return
    }
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
  /**
   * 自动续跑: 把干预消息写入 agent inbox 并唤醒驱动(agent.followup),
   * 新一轮请求随即开始——打断之后立即以调整后的条件继续任务, 而不是停下等用户。
   * agents 服务不可用/无权限时回退为 pendingHints(下一轮注入, 不续跑)。
   */
  /** 取会话对应的 agent(agents 服务按 sessionId 索引) */
  const agentFor = (sessionId) => {
    try {
      const registry = ctx.agents
      return registry && typeof registry.get === 'function' ? registry.get(sessionId) : undefined
    } catch {
      return undefined
    }
  }
  /**
   * L2/L3: 强制停掉当前正在运行的回合(agent.cancel, 保留 inbox 队列),
   * 相当于在输入框里重新注入一段上下文——软重启对话。
   */
  const cancelCurrentTurn = (sessionId, reason) => {
    try {
      const agent = agentFor(sessionId)
      if (agent && typeof agent.cancel === 'function') {
        agent.cancel({ kind: 'hook', reason: reason }, { keepInbox: true })
        return true
      }
    } catch (err) {
      warnOnce('anchored-monitor: 回合取消失败: ' + String(err && err.message ? err.message : err))
    }
    return false
  }
  /** 自动续跑: 把干预消息写入 agent inbox 并唤醒驱动(agent.followup) */
  const submitContinuation = (sessionId, text) => {
    let delivered = false
    try {
      const agent = agentFor(sessionId)
      if (agent && typeof agent.followup === 'function') {
        agent.followup({
          role: 'user',
          content: [{ type: 'text', text }],
          source: { kind: 'anchored-monitor', form: 'continuation' }
        })
        delivered = true
      }
    } catch (err) {
      warnOnce('anchored-monitor: 自动续跑失败, 回退为下一轮注入: ' + String(err && err.message ? err.message : err))
    }
    if (!delivered) pendingHints.set(sessionId, text)
  }
  const executeSignal = (signal) => {
    try {
      if (signal.level === 'L1') {
        submitContinuation(signal.sessionId, signal.payload && signal.payload.hintText ? signal.payload.hintText : '')
        ackSignal(signal, 'executed')
      } else if (signal.level === 'L2') {
        // L2 = 软重启: ①取消当前运行中的回合(保留 inbox); ②设置重置载荷(下一轮 assemble 消费);
        // ③followup 注入"重新输入"的上下文——以 Minimal persona + 双工具继续任务
        pendingResets.set(signal.sessionId, (signal.payload && signal.payload.reset) || { systemPrompt: '', tools: [] })
        cancelCurrentTurn(signal.sessionId, 'anchored-monitor L2 reset')
        submitContinuation(signal.sessionId, 'anchored-monitor: react-band trajectory detected (' + (signal.reason || '') + '). An L2 soft-restart is applied — the running turn was stopped and this request continues under the minimal 46-character persona with the bash and str_replace_editor bootstrap pair. Continue the task from where you left off, in a plan-first collective style (we will …). 锚定监控已执行 L2 强制重置: 当前回合已停止, 本轮以 Minimal 46 字符句 + 双工具软重启, 请以规划式风格(we will / we need)从刚才的位置继续任务。')
        ackSignal(signal, 'executed')
      } else if (signal.level === 'L3') {
        // L3 = 软重启 + 重启建议
        pendingResets.set(signal.sessionId, (signal.payload && signal.payload.reset) || { systemPrompt: '', tools: [] })
        cancelCurrentTurn(signal.sessionId, 'anchored-monitor L3 restart advice')
        submitContinuation(signal.sessionId, 'anchored-monitor: L2 retries exhausted (' + (signal.reason || '') + '). A full session restart is recommended for the cleanest state; the running turn was stopped and the reset condition is applied — continue the task in a plan-first style. 锚定监控提示: L2 重试已耗尽, 建议全新会话; 当前回合已停止并应用重置条件, 请以规划式风格继续任务。')
        ackSignal(signal, 'executed')
      }
    } catch (err) {
      ackSignal(signal, 'failed: ' + String(err && err.message ? err.message : err))
    }
  }
  // 干预执行以监控快照为唯一事实源(状态 sent=未执行): 轮询会话列表,
  // 只对 status==='sent' 且未处理过的干预执行——监控重启/插件晚到都能自愈。
  const pollInterventions = async () => {
    if (!config.enabled) return
    let summaries = []
    try {
      const res = await fetch(config.monitorUrl + '/api/sessions', { signal: AbortSignal.timeout(2500) })
      if (!res.ok) return
      summaries = await res.json()
    } catch {
      return
    }
    if (!Array.isArray(summaries)) return
    for (const summary of summaries) {
      const sessionId = summary.sessionId
      if (!sessionId || !(summary.interventions > 0)) continue
      let snapshot = null
      try {
        const sres = await fetch(config.monitorUrl + '/api/sessions/' + encodeURIComponent(sessionId), { signal: AbortSignal.timeout(2500) })
        if (!sres.ok) continue
        snapshot = await sres.json()
      } catch {
        continue
      }
      const list = snapshot && snapshot.interventions ? snapshot.interventions : []
      for (const iv of list) {
        if (iv.status !== 'sent') continue
        if (iv.sequence <= (handledSeq.get(sessionId) ?? 0)) continue
        handledSeq.set(sessionId, iv.sequence)
        executeSignal(iv)
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
        path: API_PREFIX + '/update-check',
        handler: async (req, res) => {
          if (!guard(req, res)) return
          if ((req.method || 'GET') !== 'GET') return writeJson(res, 405, { error: 'method not allowed' })
          const now = Date.now()
          if (updateCache && now - updateCache.at < UPDATE_TTL_MS) {
            return writeJson(res, 200, { ok: true, ...updateCache })
          }
          try {
            const localRaw = await readFile(path.join(PACKAGE_ROOT, 'package.json'), 'utf8')
            const current = String(JSON.parse(localRaw).version || '0.0.0')
            let latest = current
            try {
              const remote = await fetch(UPDATE_RAW_URL, { signal: AbortSignal.timeout(6000) })
              if (remote.ok) latest = String(JSON.parse(await remote.text()).version || current)
            } catch (e) {
              warnOnce('anchored-monitor: 更新检查上游不可达: ' + String(e && e.message ? e.message : e))
            }
            const hasUpdate = semverGt(latest, current)
            updateCache = { at: now, current: current, latest: latest, hasUpdate: hasUpdate }
            return writeJson(res, 200, {
              ok: true,
              current: current,
              latest: latest,
              hasUpdate: hasUpdate,
              releaseUrl: 'https://github.com/Aik358/dsh-anchored-monitor/releases/tag/v' + latest,
              npmUrl: 'https://www.npmjs.com/package/@a9i5k4/dsh-anchored-monitor'
            })
          } catch (err) {
            return writeJson(res, 200, { ok: false, error: 'update-check failed: ' + String(err && err.message ? err.message : err) })
          }
        }
      },
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
        path: API_PREFIX + '/intervention',
        handler: async (req, res) => {
          if (!guard(req, res)) return
          if (req.method === 'GET') {
            try {
              const upstream = await fetch(config.monitorUrl + '/api/intervention', { signal: AbortSignal.timeout(2000) })
              const body = await upstream.text()
              res.writeHead(upstream.status, { 'content-type': 'application/json; charset=utf-8' })
              res.end(body)
            } catch {
              writeJson(res, 502, { ok: false, monitorOnline: false, error: 'monitor-offline' })
            }
            return
          }
          if (req.method === 'POST') {
            const payload = await readJsonBody(req)
            if (!payload || typeof payload.enabled !== 'boolean') return writeJson(res, 400, { ok: false, error: '需要 { enabled: boolean }' })
            let forwarded = false
            try {
              const upstream = await fetch(config.monitorUrl + '/api/intervention', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ enabled: payload.enabled }),
                signal: AbortSignal.timeout(2000)
              })
              const body = await upstream.text()
              forwarded = upstream.ok
              res.writeHead(upstream.status, { 'content-type': 'application/json; charset=utf-8' })
              res.end(body)
            } catch {
              writeJson(res, 502, { ok: false, monitorOnline: false, error: 'monitor-offline' })
              return
            }
            if (forwarded) {
              // 持久化: 下次监控进程启动沿用
              try {
                await reload()
                const nextOverrides = { ...config.monitorOverrides }
                if (!nextOverrides.intervention || typeof nextOverrides.intervention !== 'object') nextOverrides.intervention = {}
                nextOverrides.intervention.enabled = payload.enabled
                const next = { ...config, monitorOverrides: nextOverrides }
                await mkdir(homeFile(), { recursive: true })
                await writeFile(configPath(), JSON.stringify(next, null, 2), 'utf8')
                await writeFile(overridesPath(), JSON.stringify(nextOverrides, null, 2), 'utf8')
                config = next
              } catch (err) {
                warnOnce('anchored-monitor: 干预开关持久化失败: ' + String(err && err.message ? err.message : err))
              }
            }
            return
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
      },
      {
        kind: 'prefix',
        path: API_PREFIX + '/assets/',
        handler: async (req, res) => {
          if (!guard(req, res)) return
          if ((req.method || 'GET') !== 'GET') return writeJson(res, 405, { error: 'method not allowed' })
          // 皮肤素材(assets/liang/liang-0..5.png): basename 白名单, 杜绝路径穿越。
          const pathname2 = new URL(req.url || '/', 'http://localhost').pathname
          const name = path.basename(pathname2)
          if (!/^liang-\d+\.png$/.test(name)) return writeJson(res, 404, { ok: false, error: 'not-found' })
          const file = path.join(PACKAGE_ROOT, 'assets', 'liang', name)
          try {
            const buf = await readFile(file)
            res.writeHead(200, {
              'content-type': 'image/png',
              'content-length': buf.length,
              'cache-control': 'public, max-age=3600'
            })
            res.end(buf)
          } catch {
            writeJson(res, 404, { ok: false, error: 'not-found' })
          }
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

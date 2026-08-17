/**
 * anchored-monitor — DeepSeek Harness 预设插件(AGENT-PLANE 服务行)
 *
 * 职责: 把每个 assistant/message 的 reasoning 块推送到本地监控进程,
 *       并执行监控进程经 SSE 发来的 L1/L2/L3 分级干预。
 *
 * 使用的研究成果(所有注入缝均为实测过的方式):
 *  - 事件监听:        ctx.on('session/event') 持久事件流 (tool-bootstrap.mjs)
 *  - L1/L3 提示注入:  agent/pre-step 决策 messages 追加 user 消息 (instruction-hint.mjs)
 *  - L2 persona 重置: system-prompt/assemble 替换 persona 段 (router-core.applyPersona)
 *  - L2 工具集收缩:   system-prompt/assemble 过滤 tools (tool-bootstrap.keepTools)
 *  - 措辞纪律:        注入文本必须中性/建议式, 禁止命令式 (anchored-flash E1/E1.5)
 */

export const name = 'anchored-monitor'

/** 本插件不注入服务, 只挂监听器 */
export const inject = []

const DEFAULTS = {
  monitorUrl: 'http://127.0.0.1:9301',
  enabled: true,
  // 单执行器原则(2026-08-18): Web 插件(host 半, lib/index.js)是干预的唯一执行者
  // (cancel 当前回合 + followup 软重启续跑)。若本 preset 与 Web 插件同时挂载,
  // 默认不再执行干预——否则 agent/pre-step 与 system-prompt/assemble 会被注册两份,
  // L2 重置执行两次、hint 重复注入。本 preset 只负责把 reasoning 推给监控进程。
  // 仅当「只用 preset、不装 Web 插件」时, 才显式配置 handleInterventions: true。
  handleInterventions: false
}

export function apply(ctx, config) {
  const source = config ?? {}
  if (typeof source !== 'object' || Array.isArray(source)) {
    throw new TypeError(`${name}: config must be an object`)
  }
  const monitorUrl = source.monitorUrl ?? DEFAULTS.monitorUrl
  const enabled = source.enabled ?? DEFAULTS.enabled
  const handleInterventions = source.handleInterventions ?? DEFAULTS.handleInterventions
  if (typeof monitorUrl !== 'string' || !/^https?:\/\//.test(monitorUrl)) {
    throw new TypeError(`${name}: monitorUrl must be an http(s) URL`)
  }

  const warned = new Set()
  const warnOnce = (message) => {
    if (warned.has(message)) return
    warned.add(message)
    try {
      ctx.logger.warn(message)
    } catch {
      // Logger unavailable — guard only avoids spam
    }
  }

  const post = (path, body) =>
    fetch(monitorUrl + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).catch((err) => warnOnce(`${name}: POST ${path} failed: ${err?.message ?? err}`))

  const seqBySession = new Map()
  const registered = new Set()

  /** 会话首个事件时向监控进程注册(含日志路径, 便于 log_tail 模式) */
  const ensureRegistered = (session) => {
    if (!session?.id || registered.has(session.id)) return
    registered.add(session.id)
    void post(`/api/sessions/${encodeURIComponent(session.id)}/register`, {
      type: 'register',
      sessionId: session.id,
      timestamp: Date.now()
    })
  }

  /** 提取 assistant/message 中的 reasoning 文本 */
  const reasoningOf = (event) => {
    const content = event?.data?.message?.content
    if (!Array.isArray(content)) return null
    const parts = content
      .filter((c) => c && (c.type === 'reasoning' || c.type === 'thinking') && typeof c.text === 'string')
      .map((c) => c.text)
    return parts.length > 0 ? parts.join('\n') : null
  }

  if (enabled) {
    ctx.on('session/event', (session, event) => {
      ensureRegistered(session)
      if (event?.type !== 'assistant/message') return
      const text = reasoningOf(event)
      if (!text) return
      const seq = (seqBySession.get(session.id) ?? 0) + 1
      seqBySession.set(session.id, seq)
      void post('/api/push', {
        type: 'reasoning_block',
        sessionId: session.id,
        sequence: seq,
        text,
        timestamp: Date.now()
      })
    })
  }

  if (!handleInterventions) return

  /** sessionId → 待注入的 L1/L3 提示文本 */
  const pendingHints = new Map()
  /** sessionId → L2 重置载荷 { systemPrompt, tools } */
  const pendingResets = new Map()

  const ack = (sessionId, level, status) =>
    void post(`/api/sessions/${encodeURIComponent(sessionId)}/ack`, {
      type: 'ack',
      sessionId,
      level,
      status,
      timestamp: Date.now()
    })

  const es = new EventSource(monitorUrl + '/api/stream')
  es.onmessage = (ev) => {
    let msg
    try {
      msg = JSON.parse(ev.data)
    } catch {
      return
    }
    if (msg?.type !== 'intervention_triggered') return
    const sessionId = msg.sessionId
    if (msg.level === 'L1') {
      pendingHints.set(sessionId, msg.payload?.hintText ?? '')
      ack(sessionId, 'L1', 'executed')
    } else if (msg.level === 'L2') {
      pendingResets.set(sessionId, msg.payload?.reset ?? null)
      ack(sessionId, 'L2', 'executed')
    } else if (msg.level === 'L3') {
      pendingHints.set(
        sessionId,
        `The monitoring system recommends restarting this session: ${msg.reason ?? 'trajectory left the spec band'}`
      )
      ack(sessionId, 'L3', 'executed')
    }
  }
  es.onerror = () => {
    // EventSource 自动重连; 连接失败只告警一次
    warnOnce(`${name}: SSE connection to ${monitorUrl} unavailable (will auto-retry)`)
  }

  /** L1/L3: 提示注入 — instruction-hint.mjs 的注入模式(必须调用 next()) */
  ctx.on('agent/pre-step', async ({ agent, signal }, next) => {
    const decision = await next()
    try {
      const session = agent?.session
      if (!session) return decision
      const hint = pendingHints.get(session.id)
      if (hint === undefined) return decision
      pendingHints.delete(session.id)
      return {
        ...decision,
        messages: [...(decision.messages ?? []), {
          id: `anchored-monitor-hint-${session.id}`,
          role: 'user',
          content: [{ type: 'text', text: hint }],
          source: { kind: 'anchored-monitor', form: 'hint' }
        }]
      }
    } catch (err) {
      warnOnce(`${name}: hint injection failed: ${err?.message ?? err}`)
      return decision
    }
  }, { prepend: true })

  /** L2: persona 重置 + 工具集收缩 — router-core.applyPersona + tool-bootstrap.keepTools 模式 */
  ctx.on('system-prompt/assemble', async (_assembly, context, next) => {
    const assembled = await next()
    try {
      const session = context?.agent?.session
      if (!session) return assembled
      const reset = pendingResets.get(session.id)
      if (!reset) return assembled
      pendingResets.delete(session.id)

      const sections = (assembled.sections ?? []).filter(
        (section) => section.name !== 'persona' && !/persona/i.test(section.name)
      )
      sections.push({ name: 'anchored-monitor-persona', text: reset.systemPrompt ?? '', order: 0 })

      const keep = new Set(reset.tools ?? [])
      const tools = Array.isArray(assembled.tools)
        ? assembled.tools.filter((tool) => keep.has(tool.name))
        : assembled.tools

      return { ...assembled, sections, tools }
    } catch (err) {
      // 过滤失败时退化为完整目录, 绝不能 brick 会话(tool-bootstrap 同款守卫)
      warnOnce(`${name}: reset injection failed: ${err?.message ?? err}`)
      return assembled
    }
  })
}

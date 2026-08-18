/* anchored-monitor dashboard */
'use strict'

const $ = (id) => document.getElementById(id)

const state = {
  config: null,
  sessions: [],
  selectedId: null,
  snapshot: null,
  feed: [],
  sseOk: false,
  chartHover: null
}

const BAND_COLORS = { spec: '#34d399', mixed: '#fbbf24', react: '#f87171', unknown: '#94a3b8' }
const TREND_ICONS = { rising: '▲', falling: '▼', stable: '─' }
const PHASE_NOTE = {
  healthy: '轨迹稳定在 spec 带 — 继续监控即可',
  warning: '进入过渡带或跌破阈值 — 已发送 L1 中性引导, 措辞必须建议式而非命令式',
  critical: 'L2 强制重置已执行: persona 切回 Minimal 46 字符句 + bash/str_replace_editor 双工具, 窗口与基线已清空',
  restart: 'L2 重试次数超限 — 建议终止并重启会话, 监控已停止对该会话干预'
}

const fmtTime = (ts) => new Date(ts).toLocaleTimeString('zh-CN', { hour12: false })
const fmtFull = (ts) => new Date(ts).toLocaleString('zh-CN', { hour12: false })
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

async function api(path, opts) {
  const res = await fetch(path, opts)
  if (!res.ok) throw new Error(path + ' → HTTP ' + res.status)
  return res.json()
}

/* ================= sessions ================= */

async function loadSessions() {
  const list = await api('/api/sessions')
  state.sessions = list
  if (list.length > 0 && (!state.selectedId || !list.some((s) => s.sessionId === state.selectedId))) {
    state.selectedId = list[0].sessionId
  }
  renderSessionList()
}

function renderSessionList() {
  const wrap = $('session-list')
  if (state.sessions.length === 0) {
    wrap.innerHTML = '<div class="muted empty">暂无会话 — 启动插件推送或注册日志会话</div>'
    return
  }
  wrap.innerHTML = state.sessions.map((s) => {
    const active = s.sessionId === state.selectedId ? 'active' : ''
    const band = s.band || 'unknown'
    const phase = s.phase || 'healthy'
    const score = s.normalizedScore === null ? '—' : s.normalizedScore.toFixed(1)
    return `<button class="session-item ${active}" data-id="${esc(s.sessionId)}">
      <span class="session-id">${esc(s.sessionId)}</span>
      <span class="session-meta">
        <span><i class="band-dot band-${esc(band)}"></i>${esc(band)} · ${esc(phase)}</span>
        <span class="mono">${score}</span>
      </span>
    </button>`
  }).join('')
  wrap.querySelectorAll('.session-item').forEach((el) => {
    el.addEventListener('click', () => {
      state.selectedId = el.dataset.id
      renderSessionList()
      refreshSnapshot()
    })
  })
}

/* ================= snapshot ================= */

async function refreshSnapshot() {
  if (!state.selectedId) return
  try {
    const snap = await api('/api/sessions/' + encodeURIComponent(state.selectedId))
    state.snapshot = snap
    render()
  } catch {
    // 会话可能刚消失, 静默
  }
}

/* ================= render ================= */

function render() {
  const snap = state.snapshot
  if (!snap) return
  const cfg = state.config
  renderKpis(snap, cfg)
  drawMainChart(snap, cfg)
  drawSparkline(snap)
  renderStateMachine(snap)
  renderInterventions(snap)
}

function renderKpis(snap, cfg) {
  const latest = snap.latest
  const band = latest ? latest.band : 'unknown'
  const bandEl = $('kpi-band-value')
  bandEl.textContent = band
  bandEl.className = 'kpi-main band-value-' + band
  const ratio = latestRatio(snap)
  $('kpi-band-sub').textContent = ratio === null
    ? 'persona ratio —'
    : 'persona ratio ' + ratio.toFixed(2) + ' · 阈值 ' + cfg.bands.spec_max + ' / ' + cfg.bands.react_min

  const score = latest ? latest.normalizedScore : null
  $('kpi-score-value').textContent = score === null ? '—' : score.toFixed(1)
  const trend = latest ? latest.trend : 'stable'
  const tEl = $('kpi-trend')
  tEl.textContent = TREND_ICONS[trend]
  tEl.className = 'trend trend-' + trend

  const agg = snap.window ? snap.window.aggregate : { positive: 0, negative: 0, neutral: 0 }
  const maxAgg = Math.max(agg.positive, agg.negative, agg.neutral, 1)
  $('bar-pos').style.width = (agg.positive / maxAgg * 100).toFixed(1) + '%'
  $('bar-neg').style.width = (agg.negative / maxAgg * 100).toFixed(1) + '%'
  $('bar-neu').style.width = (agg.neutral / maxAgg * 100).toFixed(1) + '%'
  $('bar-pos-v').textContent = agg.positive.toFixed(1)
  $('bar-neg-v').textContent = agg.negative.toFixed(1)
  $('bar-neu-v').textContent = agg.neutral.toFixed(1)

  const b = snap.baseline
  $('kpi-baseline-mean').textContent = b.mean === null ? '—' : b.mean.toFixed(1)
  $('kpi-baseline-std').textContent = b.std === null ? '±—' : '±' + b.std.toFixed(1)
  $('kpi-baseline-n').textContent = b.samples

  const iv = countInterventions(snap)
  $('iv-l1').textContent = iv.L1
  $('iv-l2').textContent = iv.L2
  $('iv-l3').textContent = iv.L3
  const cd = snap.cooldowns
  $('kpi-cooldowns').textContent = '冷却 L1/L2/L3: ' + (cd.L1 / 1000).toFixed(1) + 's / ' + (cd.L2 / 1000).toFixed(1) + 's / ' + (cd.L3 / 1000).toFixed(1) + 's'
}

function latestRatio(snap) {
  const h = snap.history
  if (h.length === 0) return null
  const last = h[h.length - 1]
  // ratio 未随快照返回时从窗口特征推导
  return last.ratio !== undefined ? last.ratio : null
}

function countInterventions(snap) {
  const out = { L1: 0, L2: 0, L3: 0 }
  for (const i of snap.interventions) out[i.level] = (out[i.level] || 0) + 1
  return out
}

/* ================= main chart ================= */

function drawMainChart(snap, cfg) {
  const canvas = $('main-chart')
  const dpr = window.devicePixelRatio || 1
  const W = canvas.clientWidth || 900
  const H = canvas.clientHeight || 320
  canvas.width = Math.round(W * dpr)
  canvas.height = Math.round(H * dpr)
  const ctx = canvas.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = 'rgba(10, 14, 26, 0.35)'
  ctx.fillRect(0, 0, W, H)

  const pad = { l: 48, r: 18, t: 12, b: 24 }
  const plotW = W - pad.l - pad.r
  const plotH = H - pad.t - pad.b
  const hist = snap.history
  if (hist.length === 0) {
    ctx.fillStyle = '#5b6585'
    ctx.font = '12px "Segoe UI", sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('等待 reasoning 数据…', W / 2, H / 2)
    return
  }
  const n = hist.length
  const yOf = (v) => pad.t + plotH * (1 - Math.min(100, Math.max(0, v)) / 100)
  const xOf = (i) => pad.l + (n === 1 ? plotW / 2 : (i / (n - 1)) * plotW)

  // grid
  ctx.font = '10px "JetBrains Mono", monospace'
  ctx.textAlign = 'right'
  for (let g = 0; g <= 100; g += 25) {
    const y = yOf(g)
    ctx.strokeStyle = 'rgba(148,163,215,0.08)'
    ctx.beginPath()
    ctx.moveTo(pad.l, y)
    ctx.lineTo(W - pad.r, y)
    ctx.stroke()
    ctx.fillStyle = '#5b6585'
    ctx.fillText(String(g), pad.l - 7, y + 3)
  }

  // band strips (point-colored vertical strip)
  const stripW = Math.max(1, plotW / n)
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = hexWithAlpha(BAND_COLORS[hist[i].band] || BAND_COLORS.unknown, 0.09)
    ctx.fillRect(xOf(i) - stripW / 2, pad.t, stripW, plotH)
  }

  // threshold lines
  drawThreshold(ctx, cfg.threshold.safety_floor, pad, plotW, plotH, yOf, '#f87171', 'safety floor')
  if (snap.baseline.mean !== null) {
    drawThreshold(ctx, snap.baseline.mean, pad, plotW, plotH, yOf, 'rgba(232,236,248,0.5)', 'baseline μ')
    const sigmaRule = (cfg.threshold.trigger || []).find((r) => r.type === 'sigma')
    const k = sigmaRule ? sigmaRule.k : 1.5
    if (snap.baseline.std !== null) {
      drawThreshold(ctx, snap.baseline.mean - k * snap.baseline.std, pad, plotW, plotH, yOf, '#fbbf24', 'μ−kσ')
    }
  }

  // line
  const grad = ctx.createLinearGradient(pad.l, 0, W - pad.r, 0)
  grad.addColorStop(0, '#8b7cff')
  grad.addColorStop(1, '#22d3ee')
  ctx.strokeStyle = grad
  ctx.lineWidth = 1.8
  ctx.lineJoin = 'round'
  ctx.beginPath()
  for (let i = 0; i < n; i++) {
    const x = xOf(i)
    const y = yOf(hist[i].normalizedScore)
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()

  // intervention markers
  const seqToX = new Map()
  hist.forEach((p, i) => seqToX.set(p.sequence, xOf(i)))
  for (const iv of snap.interventions) {
    let x = seqToX.get(iv.sequence)
    if (x === undefined) continue
    const y = pad.t + plotH * 0.5
    const color = iv.level === 'L1' ? '#fbbf24' : iv.level === 'L2' ? '#60a5fa' : '#f87171'
    ctx.fillStyle = color
    ctx.strokeStyle = 'rgba(7,10,20,0.9)'
    ctx.lineWidth = 1.4
    ctx.beginPath()
    ctx.arc(x, y, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = color
    ctx.font = '9.5px "JetBrains Mono", monospace'
    ctx.textAlign = 'center'
    ctx.fillText(iv.level, x, y + 15)
  }

  // hover crosshair + tooltip
  const hover = state.chartHover
  if (hover && hover.snapshotSeq >= 0) {
    const idx = clamp(hover.index, 0, n - 1)
    const p = hist[idx]
    const x = xOf(idx)
    ctx.strokeStyle = 'rgba(232,236,248,0.35)'
    ctx.setLineDash([3, 3])
    ctx.beginPath()
    ctx.moveTo(x, pad.t)
    ctx.lineTo(x, pad.t + plotH)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = 'rgba(139,124,255,0.18)'
    ctx.beginPath()
    ctx.arc(x, yOf(p.normalizedScore), 4, 0, Math.PI * 2)
    ctx.fill()
    showTooltip(canvas, x, p)
  } else {
    hideTooltip()
  }

  $('chart-range').textContent =
    'seq ' + hist[0].sequence + ' → ' + hist[n - 1].sequence + ' · ' + n + ' 块 · 置信度 ' +
    (hist[n - 1].confidence ? (hist[n - 1].confidence * 100).toFixed(0) + '%' : '—')
}

function drawThreshold(ctx, value, pad, plotW, plotH, yOf, color, label) {
  const y = yOf(value)
  ctx.strokeStyle = color
  ctx.setLineDash([5, 4])
  ctx.globalAlpha = 0.65
  ctx.beginPath()
  ctx.moveTo(pad.l, y)
  ctx.lineTo(pad.l + plotW, y)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.globalAlpha = 1
  ctx.fillStyle = color
  ctx.font = '9.5px "JetBrains Mono", monospace'
  ctx.textAlign = 'left'
  ctx.fillText(label + ' ' + Number(value).toFixed(1), pad.l + 6, y - 4)
}

function hexWithAlpha(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')'
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)) }

/* tooltip */
let tooltipEl = null
function showTooltip(canvas, x, p) {
  if (!tooltipEl) {
    tooltipEl = document.createElement('div')
    tooltipEl.className = 'chart-tooltip'
    canvas.parentElement.appendChild(tooltipEl)
  }
  tooltipEl.innerHTML =
    '<div>seq <b>' + esc(p.sequence) + '</b></div>' +
    '<div>score <b>' + esc(p.normalizedScore.toFixed(1)) + '</b> · band <b class="tt-' + esc(p.band) + '">' + esc(p.band) + '</b></div>' +
    '<div>trend <b>' + esc(p.trend) + '</b> · phase <b>' + esc(p.phase) + '</b></div>'
  tooltipEl.style.display = 'block'
  const rect = canvas.getBoundingClientRect()
  tooltipEl.style.left = Math.min(rect.width - 130, Math.max(0, x - 60)) + 'px'
  tooltipEl.style.top = '8px'
}
function hideTooltip() {
  if (tooltipEl) tooltipEl.style.display = 'none'
}

function bindChartHover() {
  const canvas = $('main-chart')
  canvas.addEventListener('mousemove', (ev) => {
    const snap = state.snapshot
    if (!snap || snap.history.length === 0) return
    const rect = canvas.getBoundingClientRect()
    const W = rect.width
    const pad = { l: 48, r: 18 }
    const plotW = W - pad.l - pad.r
    const n = snap.history.length
    const rel = (ev.clientX - rect.left - pad.l) / plotW
    const idx = Math.round(clamp(rel, 0, 1) * (n - 1))
    state.chartHover = { index: idx, snapshotSeq: snap.history[idx].sequence }
    drawMainChart(snap, state.config)
  })
  canvas.addEventListener('mouseleave', () => {
    state.chartHover = null
    if (state.snapshot) drawMainChart(state.snapshot, state.config)
  })
}

/* sparkline */
function drawSparkline(snap) {
  const canvas = $('sparkline')
  const dpr = window.devicePixelRatio || 1
  const W = canvas.clientWidth || 140
  const H = canvas.clientHeight || 34
  canvas.width = W * dpr
  canvas.height = H * dpr
  const ctx = canvas.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, W, H)
  const hist = snap.history.slice(-40)
  if (hist.length < 2) return
  const n = hist.length
  const grad = ctx.createLinearGradient(0, 0, W, 0)
  grad.addColorStop(0, '#8b7cff')
  grad.addColorStop(1, '#22d3ee')
  ctx.strokeStyle = grad
  ctx.lineWidth = 1.6
  ctx.beginPath()
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * W
    const y = H - 2 - (hist[i].normalizedScore / 100) * (H - 4)
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()
}

/* ================= state machine + interventions ================= */

function renderStateMachine(snap) {
  const phase = snap.phase || 'healthy'
  document.querySelectorAll('.sm-node').forEach((el) => {
    el.className = 'sm-node' + (el.dataset.phase === phase ? ' active-' + phase : '')
  })
  const chip = $('phase-chip')
  chip.textContent = phase
  chip.className = 'phase-chip phase-' + phase
  $('sm-note').textContent = PHASE_NOTE[phase] || ''
  $('l2-attempts').textContent = 'L2 已尝试 ' + snap.l2Attempts + ' / ' + (state.config ? state.config.intervention.max_L2_attempts : 2)
}

function renderInterventions(snap) {
  const rows = snap.interventions.slice().reverse()
  const tbody = document.querySelector('#intervention-table tbody')
  tbody.innerHTML = rows.map((i) =>
    '<tr>' +
    '<td><span class="badge badge-' + esc(i.level) + '">' + esc(i.level) + '</span></td>' +
    '<td>' + esc(i.reason) + '</td>' +
    '<td class="mono">' + esc(i.sequence) + '</td>' +
    '<td class="mono">' + esc(fmtFull(i.timestamp)) + '</td>' +
    '<td class="status-' + esc(i.status) + '">' + esc(i.status === 'acked' ? '已确认' : '已发送') + '</td>' +
    '</tr>'
  ).join('')
  $('no-interventions').style.display = rows.length === 0 ? 'block' : 'none'
  $('intervention-table').style.display = rows.length === 0 ? 'none' : 'table'
}

/* ================= event feed ================= */

function pushFeed(evt) {
  const label = feedLabel(evt)
  if (!label) return
  state.feed.unshift({ time: fmtTime(evt.timestamp || Date.now()), kind: label.kind, text: label.text, cls: label.cls, sessionId: evt.sessionId })
  if (state.feed.length > 40) state.feed.pop()
  renderFeed()
}

function feedLabel(evt) {
  switch (evt.type) {
    case 'score_computed':
      if (state.selectedId && evt.sessionId && evt.sessionId !== state.selectedId) return null
      return { kind: 'score', cls: 'k-score', text: '#' + evt.sequence + ' score ' + evt.normalizedScore.toFixed(1) + ' · ' + evt.band + ' · ' + evt.trend }
    case 'threshold_check':
      if (!evt.triggered) return null
      if (state.selectedId && evt.sessionId && evt.sessionId !== state.selectedId) return null
      return { kind: 'threshold', cls: 'k-threshold', text: '#' + evt.sequence + ' 触发: ' + evt.matched.join(', ') }
    case 'intervention_triggered':
      return { kind: evt.level, cls: 'k-intervention', text: (state.sessions.length > 1 ? shortId(evt.sessionId) + ' ' : '') + '#' + evt.sequence + ' ' + evt.level + ' · ' + evt.reason }
    case 'ack_received':
      return { kind: 'ack', cls: 'k-ack', text: (state.sessions.length > 1 ? shortId(evt.sessionId) + ' ' : '') + evt.level + ' 已执行' }
    case 'guard_triggered':
      return { kind: 'guard', cls: 'k-guard', text: (state.sessions.length > 1 ? shortId(evt.sessionId) + ' ' : '') + (evt.guard === 'text_leak' ? '🧠 CoT 泄漏' : '⏸ CoT 停摆') + ' · ' + evt.detail }
    case 'session_start':
      return { kind: 'session', cls: 'k-session', text: '会话启动 ' + shortId(evt.sessionId) + ' · ' + evt.configHash }
    case 'session_end':
      return { kind: 'session', cls: 'k-session', text: '会话结束 ' + shortId(evt.sessionId) + ' · ' + evt.reason }
    default:
      return null
  }
}

const shortId = (id) => String(id).slice(0, 12) + '…'

function renderFeed() {
  const wrap = $('event-feed')
  if (state.feed.length === 0) {
    wrap.innerHTML = '<div class="muted empty">等待事件流…</div>'
    return
  }
  wrap.innerHTML = state.feed.map((e) =>
    '<div class="event-row ' + e.cls + '">' +
    '<span class="event-time">' + esc(e.time) + '</span>' +
    '<span class="event-kind">' + esc(e.kind) + '</span>' +
    '<span class="event-text">' + esc(e.text) + '</span>' +
    '</div>'
  ).join('')
}

/* ================= boot ================= */

function connectStream() {
  const es = new EventSource('/api/stream')
  es.onopen = () => {
    state.sseOk = true
    $('sse-chip').className = 'chip chip-ok'
    $('sse-chip').querySelector('.sse-label').textContent = 'stream 已连接'
  }
  es.onmessage = (ev) => {
    let msg
    try { msg = JSON.parse(ev.data) } catch { return }
    if (msg.type === 'stream_ready') return
    pushFeed(msg)
    if (msg.sessionId === state.selectedId && (msg.type === 'score_computed' || msg.type === 'intervention_triggered')) {
      refreshSnapshot()
    }
    if (msg.type === 'session_start' || msg.type === 'session_end') loadSessions()
  }
  es.onerror = () => {
    state.sseOk = false
    $('sse-chip').className = 'chip chip-off'
    $('sse-chip').querySelector('.sse-label').textContent = 'stream 重连中…'
  }
}

function renderConfigInfo(cfg) {
  if (!cfg) return
  $('profile-chip').textContent = 'profile: ' + (cfg.version || '?')
  $('config-hash').textContent = cfg.version ? 'v' + cfg.version : '—'
  $('app-version').textContent = cfg.version || '—'
  $('band-spec-max').textContent = cfg.bands ? cfg.bands.spec_max : '0.2'
  $('band-react-min').textContent = cfg.bands ? cfg.bands.react_min : '0.5'
}

function setupChrome() {
  bindChartHover()
  $('refresh-sessions').addEventListener('click', loadSessions)
  $('clear-feed').addEventListener('click', () => { state.feed = []; renderFeed() })
  setInterval(() => { $('clock').textContent = fmtTime(Date.now()) }, 1000)
  $('clock').textContent = fmtTime(Date.now())
  window.addEventListener('resize', () => {
    if (state.snapshot) {
      drawMainChart(state.snapshot, state.config)
      drawSparkline(state.snapshot)
    }
  })
}

async function boot() {
  // 离线预览模式: 快照直接内嵌, 不依赖 HTTP/SSE
  if (window.EMBEDDED) {
    state.config = window.EMBEDDED.config || null
    state.sessions = window.EMBEDDED.sessions || []
    state.snapshot = window.EMBEDDED.snapshot || null
    state.selectedId = state.snapshot ? state.snapshot.sessionId : (state.sessions[0] ? state.sessions[0].sessionId : null)
    $('sse-chip').className = 'chip chip-ok'
    $('sse-chip').querySelector('.sse-label').textContent = 'snapshot 已加载'
    renderConfigInfo(state.config)
    setupChrome()
    renderSessionList()
    render()
    return
  }
  try {
    state.config = await api('/api/config')
  } catch {
    // 配置接口失败不阻塞页面
  }
  renderConfigInfo(state.config)
  setupChrome()
  await loadSessions()
  connectStream()
  setInterval(refreshSnapshot, 500)
  setInterval(loadSessions, 2500)
  refreshSnapshot()
}

boot().catch((err) => {
  $('event-feed').innerHTML = '<div class="muted empty">启动失败: ' + esc(err.message) + '</div>'
})

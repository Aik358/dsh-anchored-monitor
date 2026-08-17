/* dsh-anchored-monitor — browser half (hand-written __ModuleLoader__ bundle, part 1/2).
 * 三个叠加面(与 dsh-auto-memory 同款注册模式):
 *   1. sidebar.footer.action — 左侧栏「锚定监控」入口按钮(带波段状态点)
 *   2. shell.overlay         — 液体毛玻璃浮层面板: 波段/强度分/轨迹图/干预级联
 *   3. 收起态: 变阻器式悬浮条(rheostat bar) — 思考强度滑条 + 实时日志滚动
 * 数据经 /api/anchored-monitor/* 同源路由(host 半代理到独立监控进程)轮询。
 * 视觉: DeepSeek 白/灰/蓝主色调, 警告类用语义色(绿/琥珀/红), 跟随 shell 深色标记。
 */
console.log('[dsh-anchored-monitor] client v0.1.0 fingerprint: liquid-glass-rheostat')
window.__ModuleLoader__.load({
  id: '@a9i5k4/dsh-anchored-monitor',
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports
    var React = require('react')
    var h = React.createElement
    var useState = React.useState
    var useEffect = React.useEffect
    var useRef = React.useRef

    var LANG_ZH = typeof document !== 'undefined' && document.documentElement && String(document.documentElement.lang || '').toLowerCase().indexOf('zh') === 0
    var T = function (zh, en) { return LANG_ZH ? zh : en }

    var TEXTS = {
      title: T('锚定监控', 'Anchored Monitor'),
      openDashboard: T('完整仪表盘', 'Full dashboard'),
      collapse: T('收起', 'Collapse'),
      close: T('关闭', 'Close'),
      monitorOnline: T('监控在线', 'Monitor online'),
      monitorOffline: T('监控离线', 'Monitor offline'),
      startHint: T('启动: npx anchored-monitor --profile demo', 'Start: npx anchored-monitor --profile demo'),
      noData: T('等待 reasoning 数据…', 'Waiting for reasoning data…'),
      band: T('波段', 'Band'),
      score: T('强度分', 'Score'),
      windowAgg: T('窗口聚合 P/N/N', 'Window P/N/N'),
      baseline: T('基线', 'Baseline'),
      interventions: T('干预', 'Interventions'),
      events: T('实时事件', 'Live events'),
      records: T('干预记录', 'Interventions'),
      samples: T('样本', 'samples'),
      attempts: T('L2 尝试', 'L2 attempts'),
      cooldown: T('冷却', 'Cooldown'),
      of: T('次', 'of')
    }
    var BAND_NAMES = { spec: 'spec', mixed: 'mixed', react: 'react', unknown: 'unknown' }
    var PHASE_NAMES = { healthy: 'healthy', warning: 'warning', critical: 'critical', restart: 'restart' }
    var BAND_COLORS = { spec: '#16a34a', mixed: '#d97706', react: '#dc2626', unknown: '#9ca3af' }

    var ICON_RADAR = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9" opacity="0.4"/><circle cx="12" cy="12" r="4.5" opacity="0.7"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><path d="M12 3v4M12 17v4" opacity="0.5"/></svg>'
    var ICON_EXT = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M9 7h8v8"/></svg>'
    var ICON_MIN = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14"/></svg>'
    var ICON_X = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>'

    // ───────────────────────── 控制器 ─────────────────────────
    var listeners = new Set()
    function emit() { listeners.forEach(function (fn) { try { fn() } catch (e) {} }) }
    function subscribe(fn) { listeners.add(fn); return function () { listeners.delete(fn) } }

    var state = {
      panelOpen: false,
      ok: false,
      enabled: true,
      monitorOnline: false,
      monitorUrl: 'http://127.0.0.1:9301',
      version: '',
      configHash: '',
      bands: { spec_max: 0.2, react_min: 0.5 },
      thresholds: { specMax: 0.2, reactMin: 0.5, safetyFloor: 10 },
      cooldowns: { L1_ms: 0, L2_ms: 0, L3_ms: 0 },
      maxL2Attempts: 5,
      sessions: [],
      selected: null,
      snapshot: null,
      events: [],
      lastError: ''
    }

    function loadJson(key, fb) { try { var raw = localStorage.getItem(key); if (raw) { var v = JSON.parse(raw); if (v && typeof v === 'object') return v } } catch (e) {} return fb }
    function saveJson(key, value) { try { localStorage.setItem(key, JSON.stringify(value)) } catch (e) {} }

    var PANEL_GEOM_KEY = 'dsh-anchored-monitor.panel.geom'
    var BAR_GEOM_KEY = 'dsh-anchored-monitor.bar.geom'

    function defaultPanelGeom() {
      var vw = window.innerWidth || 1280
      var vh = window.innerHeight || 800
      var w = Math.min(880, Math.max(430, Math.round(vw * 0.54)))
      var h = Math.min(700, Math.max(360, Math.round(vh * 0.72)))
      return { left: Math.max(16, vw - w - 24), top: Math.max(16, Math.round((vh - h) / 2)), width: w, height: h }
    }
    function clampPanel(g) {
      var vw = window.innerWidth || 1280
      var vh = window.innerHeight || 800
      var w = Math.max(360, Math.min(g.width || 640, vw - 32))
      var h = Math.max(300, Math.min(g.height || 480, vh - 32))
      return {
        left: Math.max(8, Math.min(g.left !== undefined ? g.left : 16, vw - w - 8)),
        top: Math.max(8, Math.min(g.top !== undefined ? g.top : 16, vh - h - 8)),
        width: w,
        height: h
      }
    }
    function defaultBarGeom() {
      var vh = window.innerHeight || 800
      return { right: 20, bottom: Math.max(80, Math.round(vh * 0.1)) }
    }
    var geomPanel = clampPanel(Object.assign(defaultPanelGeom(), loadJson(PANEL_GEOM_KEY, {})))
    var geomBar = Object.assign(defaultBarGeom(), loadJson(BAR_GEOM_KEY, {}))
    function persistGeoms() { saveJson(PANEL_GEOM_KEY, geomPanel); saveJson(BAR_GEOM_KEY, geomBar) }

    function setPanelOpen(v) { state.panelOpen = v; emit() }
    function togglePanel() { setPanelOpen(!state.panelOpen) }

    function esc(s) {
      return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
      })
    }
    function shortId(id) { var s = String(id || ''); return s.length > 14 ? s.slice(0, 13) + '…' : s }
    function fmtTime(ts) { var d = new Date(ts); var p = function (n) { return (n < 10 ? '0' : '') + n }; return p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds()) }

    // ───────────────────────── 数据轮询 ─────────────────────────
    var POLL_MS = 1200
    var pollTimer = null
    async function pollOnce() {
      try {
        var q = state.selected ? '?sessionId=' + encodeURIComponent(state.selected) : ''
        var res = await fetch('/api/anchored-monitor/overview' + q, { cache: 'no-store' })
        var j = await res.json()
        if (j && typeof j === 'object' && j.ok) {
          state.ok = true
          state.monitorOnline = !!j.monitorOnline
          state.version = j.version || ''
          state.configHash = j.configHash || ''
          state.bands = j.bands || state.bands
          state.thresholds = j.thresholds || state.thresholds
          state.cooldowns = j.cooldowns || state.cooldowns
          state.maxL2Attempts = j.maxL2Attempts != null ? j.maxL2Attempts : 5
          state.sessions = j.sessions || []
          state.selected = j.selected || null
          state.snapshot = j.snapshot || null
          state.events = j.events || []
          state.lastError = ''
        } else {
          state.ok = false
          state.monitorOnline = false
          state.lastError = (j && (j.hint || j.error)) || TEXTS.startHint
        }
      } catch (err) {
        state.ok = false
        state.monitorOnline = false
        state.lastError = String(err && err.message ? err.message : err)
      }
      emit()
    }
    function startPolling() {
      if (pollTimer) return
      pollOnce()
      pollTimer = setInterval(pollOnce, POLL_MS)
    }
    function stopPolling() {
      if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
    }
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') stopPolling()
      else startPolling()
    })

    // ───────────────────────── 派生值 ─────────────────────────
    function latestPoint() {
      var snap = state.snapshot
      if (!snap || !snap.history || !snap.history.length) return null
      return snap.history[snap.history.length - 1]
    }
    function currentBand() { var p = latestPoint(); return p ? p.band : 'unknown' }
    function currentScore() { var p = latestPoint(); return p ? p.normalizedScore : null }
    function currentPhase() { return state.snapshot ? (state.snapshot.phase || 'healthy') : 'healthy' }

    function eventLabel(e) {
      if (!e) return null
      switch (e.type) {
        case 'score_computed': return '#' + e.sequence + ' ' + TEXTS.score + ' ' + Number(e.normalizedScore).toFixed(1) + ' · ' + e.band + ' · ' + e.trend
        case 'threshold_check': return e.triggered ? '#' + e.sequence + ' ⚠ ' + (e.matched || []).join(', ') : null
        case 'intervention_triggered': return e.level + ' #' + e.sequence + ' · ' + e.reason
        case 'ack_received': return e.level + ' ✓'
        case 'session_start': return T('会话启动', 'Session start') + ' · ' + shortId(e.sessionId)
        case 'session_end': return T('会话结束', 'Session end') + ' · ' + e.reason
        default: return null
      }
    }

    // ───────────────────────── React 表面 ─────────────────────────
    function SidebarButton() {
      var openState = useState(state.panelOpen)
      var open = openState[0]; var setOpen = openState[1]
      var bandState = useState('unknown')
      var band = bandState[0]; var setBand = bandState[1]
      useEffect(function () {
        return subscribe(function () { setOpen(state.panelOpen); setBand(currentBand()) })
      }, [])
      return h('div', {
        className: 'am-side-entry' + (open ? ' am-side-open' : ''),
        title: TEXTS.title,
        onClick: togglePanel
      },
        h('span', { className: 'am-side-ico', dangerouslySetInnerHTML: { __html: ICON_RADAR } }),
        h('span', { className: 'am-side-label' }, TEXTS.title),
        h('i', { className: 'am-dot am-band-' + band }))
    }

    function AmOverlay() {
      var ref = useRef(null)
      useEffect(function () {
        var el = ref.current
        if (!el) return
        mountOverlay(el)
        return function () { unmountOverlay(el) }
      }, [])
      return h('div', { ref: ref, className: 'am-overlay-host' })
    }

    // ───────────────────────── apply ─────────────────────────
    function apply(ctx) {
      var slots = ctx.slots
      try {
        slots.inject('sidebar.footer.action', function () {
          return slots.register({ name: 'sidebar.footer.action', id: 'anchored-monitor', order: 40, label: TEXTS.title }, function () { return h(SidebarButton) })
        })
      } catch (e) { console.warn('[dsh-anchored-monitor] sidebar slot failed', e) }
      try {
        slots.inject('shell.overlay', function () {
          return slots.register({ name: 'shell.overlay', id: 'anchored-monitor', order: 40 }, function () { return h(AmOverlay) })
        })
      } catch (e) { console.warn('[dsh-anchored-monitor] overlay slot failed', e) }
      startPolling()
      console.log('[dsh-anchored-monitor] client ready: sidebar entry + liquid-glass overlay + rheostat bar')
    }

    exports.inject = ['slots', 'sessions']
    exports.apply = apply

    // ══════════════════════════ part 2: 液体玻璃浮层 + 变阻器条 ══════════════════════════

    var STYLE_TEXT = [
      '.am-overlay-host{position:fixed;inset:0;pointer-events:none;z-index:2147483000;',
      '--am-blue:#4d6bfe;--am-blue-2:#22d3ee;',
      '--am-bg:rgba(255,255,255,0.72);--am-bg-solid:rgba(255,255,255,0.92);',
      '--am-card:rgba(255,255,255,0.55);--am-border:rgba(15,23,42,0.10);--am-border-strong:rgba(15,23,42,0.18);',
      '--am-text:#1f2329;--am-muted:#667085;--am-faint:#98a2b3;--am-track:rgba(15,23,42,0.10);',
      '--am-shadow:0 18px 50px rgba(15,23,42,0.16),0 2px 8px rgba(15,23,42,0.08);',
      'font-family:-apple-system,"Segoe UI","PingFang SC","Microsoft YaHei",system-ui,sans-serif}',
      'body[data-ds-dark-theme] .am-overlay-host{--am-bg:rgba(13,17,28,0.74);--am-bg-solid:rgba(17,22,36,0.92);',
      '--am-card:rgba(148,163,215,0.08);--am-border:rgba(148,163,215,0.16);--am-border-strong:rgba(148,163,215,0.28);',
      '--am-text:#e8ecf8;--am-muted:#8b96b5;--am-faint:#5b6585;--am-track:rgba(148,163,215,0.18);',
      '--am-shadow:0 18px 50px rgba(2,6,18,0.5),0 2px 8px rgba(2,6,18,0.3)}',
      '.am-overlay-host *{box-sizing:border-box}',
      '.am-mono{font-family:"JetBrains Mono","Cascadia Code",Consolas,monospace;font-variant-numeric:tabular-nums}',
      // ── 变阻器条 ──
      '.am-bar{position:fixed;display:flex;align-items:center;gap:9px;height:40px;padding:0 7px 0 11px;border-radius:999px;',
      'background:var(--am-bg);border:1px solid var(--am-border-strong);box-shadow:var(--am-shadow);',
      'backdrop-filter:blur(20px) saturate(160%);-webkit-backdrop-filter:blur(20px) saturate(160%);',
      'cursor:grab;user-select:none;pointer-events:auto;transition:box-shadow .2s ease,transform .2s ease}',
      '.am-bar:hover{transform:translateY(-1px);box-shadow:0 22px 60px rgba(15,23,42,0.22)}',
      '.am-bar:active{cursor:grabbing}',
      '.am-bar-ico{display:flex;color:var(--am-blue);flex:none}',
      '.am-bar-dot{width:9px;height:9px;border-radius:50%;flex:none}',
      '.am-band-spec{background:#16a34a;box-shadow:0 0 8px rgba(22,163,74,0.8)}',
      '.am-band-mixed{background:#d97706;box-shadow:0 0 8px rgba(217,119,6,0.8)}',
      '.am-band-react{background:#dc2626;box-shadow:0 0 8px rgba(220,38,38,0.8)}',
      '.am-band-unknown{background:#9ca3af}',
      '.am-bar-track{position:relative;flex:1;min-width:96px;height:8px;border-radius:99px;background:var(--am-track)}',
      '.am-bar-fill{position:absolute;left:0;top:0;bottom:0;width:0;border-radius:99px;',
      'background:linear-gradient(90deg,var(--am-blue),var(--am-blue-2));transition:width .5s cubic-bezier(.4,0,.2,1),background .3s ease}',
      '.am-bar-fill.am-fill-spec{background:linear-gradient(90deg,#4d6bfe,#16a34a)}',
      '.am-bar-fill.am-fill-mixed{background:linear-gradient(90deg,#4d6bfe,#d97706)}',
      '.am-bar-fill.am-fill-react{background:linear-gradient(90deg,#4d6bfe,#dc2626)}',
      '.am-bar-fill.am-fill-unknown{background:var(--am-faint)}',
      '.am-bar-tick{position:absolute;top:-3px;bottom:-3px;width:1px;background:var(--am-border-strong)}',
      '.am-bar-knob{position:absolute;top:50%;left:0;width:15px;height:15px;border-radius:50%;transform:translate(-50%,-50%);',
      'background:#fff;border:2px solid var(--am-blue);box-shadow:0 1px 6px rgba(15,23,42,0.35);transition:left .5s cubic-bezier(.4,0,.2,1)}',
      'body[data-ds-dark-theme] .am-bar-knob{background:#0b1020}',
      '.am-bar-score{font-size:13px;font-weight:700;color:var(--am-text);min-width:38px;text-align:right}',
      '.am-bar-phase{font-size:10.5px;padding:2px 8px;border-radius:999px;border:1px solid var(--am-border-strong);color:var(--am-muted);flex:none}',
      '.am-phase-healthy{color:#16a34a;border-color:rgba(22,163,74,0.45)}',
      '.am-phase-warning{color:#d97706;border-color:rgba(217,119,6,0.45)}',
      '.am-phase-critical{color:#dc2626;border-color:rgba(220,38,38,0.45)}',
      '.am-phase-restart{color:#7c3aed;border-color:rgba(124,58,237,0.45)}',
      '.am-phase-offline{color:var(--am-faint)}',
      '.am-bar-ticker{flex:0 1 132px;min-width:0;font-size:11px;color:var(--am-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;',
      '-webkit-mask-image:linear-gradient(90deg,#000 72%,transparent);mask-image:linear-gradient(90deg,#000 72%,transparent)}',
      // ── 面板 ──
      '.am-panel{position:fixed;display:flex;flex-direction:column;border-radius:20px;background:var(--am-bg);',
      'border:1px solid var(--am-border-strong);box-shadow:var(--am-shadow);',
      'backdrop-filter:blur(24px) saturate(160%);-webkit-backdrop-filter:blur(24px) saturate(160%);',
      'overflow:hidden;pointer-events:auto;animation:am-panel-in .18s cubic-bezier(.2,.8,.2,1)}',
      '@keyframes am-panel-in{from{opacity:0;transform:scale(.965) translateY(6px)}to{opacity:1;transform:none}}',
      '.am-panel-header{display:flex;align-items:center;gap:9px;padding:11px 13px;border-bottom:1px solid var(--am-border);',
      'cursor:grab;user-select:none;background:linear-gradient(180deg,rgba(77,107,254,0.07),transparent)}',
      '.am-panel-header:active{cursor:grabbing}',
      '.am-panel-title{display:flex;align-items:center;gap:7px;font-size:13.5px;font-weight:650;color:var(--am-text)}',
      '.am-panel-title svg{color:var(--am-blue)}',
      '.am-chip{font-size:11px;padding:3px 10px;border-radius:999px;border:1px solid var(--am-border-strong);color:var(--am-muted);flex:none}',
      '.am-chip-band.am-cb-spec{color:#16a34a;border-color:rgba(22,163,74,0.5);background:rgba(22,163,74,0.08)}',
      '.am-chip-band.am-cb-mixed{color:#d97706;border-color:rgba(217,119,6,0.5);background:rgba(217,119,6,0.08)}',
      '.am-chip-band.am-cb-react{color:#dc2626;border-color:rgba(220,38,38,0.5);background:rgba(220,38,38,0.08)}',
      '.am-status-ok{color:#16a34a;border-color:rgba(22,163,74,0.45)}',
      '.am-status-off{color:#dc2626;border-color:rgba(220,38,38,0.45)}',
      '.am-panel-actions{margin-left:auto;display:flex;gap:6px}',
      '.am-btn{display:inline-flex;align-items:center;gap:5px;font-size:12px;padding:5px 10px;border-radius:9px;',
      'border:1px solid var(--am-border);background:transparent;color:var(--am-muted);cursor:pointer;transition:all .15s ease}',
      '.am-btn:hover{background:rgba(77,107,254,0.12);border-color:rgba(77,107,254,0.5)}',
      '.am-btn-ico{width:26px;padding:5px 0;justify-content:center}',
      '.am-select{font-size:11px;padding:4px 8px;border-radius:8px;border:1px solid var(--am-border-strong);background:var(--am-card);color:var(--am-text);max-width:130px}',
      '.am-offline{margin:8px 13px 0;padding:7px 10px;border-radius:10px;font-size:11.5px;color:#dc2626;',
      'background:rgba(220,38,38,0.08);border:1px solid rgba(220,38,38,0.3)}',
      '.am-kpis{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;padding:11px 13px 4px}',
      '.am-kpi{background:var(--am-card);border:1px solid var(--am-border);border-radius:12px;padding:8px 10px;min-width:0}',
      '.am-kpi-label{font-size:10px;letter-spacing:.6px;text-transform:uppercase;color:var(--am-faint);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.am-kpi-value{font-size:17px;font-weight:700;color:var(--am-text);margin-top:2px;white-space:nowrap;overflow:hidden}',
      '.am-kpi-sub{font-size:10.5px;color:var(--am-muted);margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.am-band-text.am-bt-spec{color:#16a34a}.am-band-text.am-bt-mixed{color:#d97706}.am-band-text.am-bt-react{color:#dc2626}.am-band-text.am-bt-unknown{color:var(--am-faint)}',
      '.am-trend-rising{color:#16a34a}.am-trend-falling{color:#dc2626}.am-trend-stable{color:var(--am-muted)}',
      '.am-chart-wrap{margin:8px 13px 0;flex:none}',
      'canvas.am-chart{width:100%;height:248px;display:block;border-radius:12px;border:1px solid var(--am-border)}',
      '.am-grid{display:grid;grid-template-columns:1fr 1.15fr;gap:10px;padding:9px 13px;min-height:0;flex:1;overflow:hidden}',
      '.am-box{background:var(--am-card);border:1px solid var(--am-border);border-radius:12px;display:flex;flex-direction:column;min-height:0;overflow:hidden}',
      '.am-box-title{font-size:10px;letter-spacing:1px;text-transform:uppercase;color:var(--am-faint);padding:7px 10px 3px;flex:none}',
      '.am-events{flex:1;overflow-y:auto;padding:0 10px 7px;min-height:0}',
      '.am-event{display:flex;gap:8px;font-size:11.5px;padding:4px 0;border-bottom:1px dashed var(--am-border);color:var(--am-muted);line-height:1.4}',
      '.am-event:last-child{border-bottom:none}',
      '.am-event.k-iv{color:#dc2626}.am-event.k-th{color:#d97706}',
      '.am-empty{font-size:11.5px;color:var(--am-faint);padding:10px 0;text-align:center}',
      '.am-table{width:100%;border-collapse:collapse;font-size:11.5px}',
      '.am-table td{padding:4px 6px;border-bottom:1px solid var(--am-border);color:var(--am-text);vertical-align:top}',
      '.am-table tr:last-child td{border-bottom:none}',
      '.am-badge{display:inline-block;padding:1px 7px;border-radius:999px;font-size:10px;font-weight:700;font-family:"JetBrains Mono",Consolas,monospace}',
      '.am-badge-L1{color:#d97706;background:rgba(217,119,6,0.14)}',
      '.am-badge-L2{color:#4d6bfe;background:rgba(77,107,254,0.14)}',
      '.am-badge-L3{color:#dc2626;background:rgba(220,38,38,0.14)}',
      '.am-panel-footer{display:flex;gap:14px;align-items:center;padding:7px 13px 9px;font-size:10.5px;color:var(--am-faint);',
      'border-top:1px solid var(--am-border);flex:none}',
      '.am-resize{position:absolute;right:0;bottom:0;width:18px;height:18px;cursor:nwse-resize}',
      '.am-resize::after{content:"";position:absolute;right:5px;bottom:5px;width:8px;height:8px;',
      'border-right:2px solid var(--am-border-strong);border-bottom:2px solid var(--am-border-strong)}',
      // ── 侧边栏入口 ──
      '.am-side-entry{display:flex;align-items:center;gap:7px;width:100%;cursor:pointer;user-select:none}',
      '.am-side-ico{display:flex;flex:none;opacity:.9}',
      '.am-side-label{flex:1;text-align:left;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.am-dot{width:7px;height:7px;border-radius:50%;flex:none}'
    ].join('\n')

    var styleInjected = false
    function injectStyle() {
      if (styleInjected) return
      styleInjected = true
      var tag = document.createElement('style')
      tag.setAttribute('data-am-style', '1')
      tag.textContent = STYLE_TEXT
      document.head.appendChild(tag)
    }

    var overlayHost = null
    var barEl = null
    var panelEl = null
    var chartCanvas = null
    var unsubscribeAll = null
    var tickerTimer = null
    var tickerIdx = 0
    var resizeHandler = null

    function mountOverlay(el) {
      overlayHost = el
      injectStyle()
      unsubscribeAll = subscribe(redrawAll)
      redrawAll()
      tickerTimer = setInterval(function () {
        tickerIdx += 1
        if (state.events.length > 0) updateTickerOnly()
      }, 2600)
      resizeHandler = function () { redrawAll() }
      window.addEventListener('resize', resizeHandler)
    }
    function unmountOverlay() {
      if (unsubscribeAll) { unsubscribeAll(); unsubscribeAll = null }
      if (tickerTimer) { clearInterval(tickerTimer); tickerTimer = null }
      if (resizeHandler) { window.removeEventListener('resize', resizeHandler); resizeHandler = null }
      removeBar()
      removePanel()
      overlayHost = null
    }

    function redrawAll() {
      if (!overlayHost) return
      if (state.panelOpen) {
        removeBar()
        ensurePanel()
        updatePanel()
      } else {
        removePanel()
        ensureBar()
        updateBar()
      }
    }

    function isDark() {
      return document.body && document.body.getAttribute('data-ds-dark-theme') !== null
    }

    // ── 变阻器条 ──
    function barHtml() {
      return '<div class="am-bar-ico">' + ICON_RADAR + '</div>'
        + '<i class="am-bar-dot am-band-unknown" data-am="dot"></i>'
        + '<div class="am-bar-track">'
        + '<div class="am-bar-fill" data-am="fill"></div>'
        + '<span class="am-bar-tick" style="left:' + (state.thresholds.specMax * 100).toFixed(0) + '%"></span>'
        + '<span class="am-bar-tick" style="left:' + (state.thresholds.reactMin * 100).toFixed(0) + '%"></span>'
        + '<i class="am-bar-knob" data-am="knob"></i>'
        + '</div>'
        + '<span class="am-bar-score am-mono" data-am="score">—</span>'
        + '<span class="am-bar-phase" data-am="phase">—</span>'
        + '<span class="am-bar-ticker" data-am="ticker"></span>'
    }
    function ensureBar() {
      if (barEl) return
      barEl = document.createElement('div')
      barEl.className = 'am-bar'
      barEl.innerHTML = barHtml()
      overlayHost.appendChild(barEl)
      bindBarDrag()
    }
    function removeBar() {
      if (barEl) { barEl.remove(); barEl = null }
    }
    function updateBar() {
      if (!barEl) return
      barEl.style.right = geomBar.right + 'px'
      barEl.style.bottom = geomBar.bottom + 'px'
      var score = currentScore()
      var band = currentBand()
      var pct = score == null ? 0 : Math.max(0, Math.min(100, score))
      var fill = barEl.querySelector('[data-am=fill]')
      var knob = barEl.querySelector('[data-am=knob]')
      var dot = barEl.querySelector('[data-am=dot]')
      var scoreEl = barEl.querySelector('[data-am=score]')
      var phaseEl = barEl.querySelector('[data-am=phase]')
      fill.style.width = pct + '%'
      fill.className = 'am-bar-fill am-fill-' + band
      knob.style.left = pct + '%'
      dot.className = 'am-bar-dot am-band-' + band
      scoreEl.textContent = score == null ? '—' : score.toFixed(1)
      if (!state.monitorOnline) {
        scoreEl.textContent = '—'
        phaseEl.textContent = 'offline'
        phaseEl.className = 'am-bar-phase am-phase-offline'
        barEl.title = state.lastError || TEXTS.startHint
      } else {
        phaseEl.textContent = PHASE_NAMES[currentPhase()]
        phaseEl.className = 'am-bar-phase am-phase-' + currentPhase()
        barEl.title = TEXTS.title + ' · ' + TEXTS.monitorOnline
      }
      updateTickerOnly()
    }
    function updateTickerOnly() {
      if (!barEl) return
      var ticker = barEl.querySelector('[data-am=ticker]')
      if (!ticker) return
      if (!state.events.length || !state.monitorOnline) {
        ticker.textContent = state.monitorOnline ? TEXTS.noData : TEXTS.monitorOffline
        return
      }
      var n = state.events.length
      var label = null
      for (var i = 0; i < n; i++) {
        var idx = n - 1 - ((tickerIdx + i) % n)
        var l = eventLabel(state.events[idx])
        if (l) { label = l; break }
      }
      if (label) {
        ticker.textContent = label
        ticker.title = label
      }
    }
    function bindBarDrag() {
      var startX = 0
      var startY = 0
      var moved = false
      var startRight = 0
      var startBottom = 0
      barEl.addEventListener('pointerdown', function (ev) {
        startX = ev.clientX
        startY = ev.clientY
        moved = false
        startRight = geomBar.right
        startBottom = geomBar.bottom
        var onMove = function (e2) {
          var dx = e2.clientX - startX
          var dy = e2.clientY - startY
          if (Math.abs(dx) + Math.abs(dy) > 5) moved = true
          if (!moved) return
          geomBar.right = Math.max(4, Math.min(startRight - dx, window.innerWidth - 80))
          geomBar.bottom = Math.max(4, Math.min(startBottom - dy, window.innerHeight - 44))
          barEl.style.right = geomBar.right + 'px'
          barEl.style.bottom = geomBar.bottom + 'px'
        }
        var onUp = function () {
          window.removeEventListener('pointermove', onMove)
          window.removeEventListener('pointerup', onUp)
          persistGeoms()
          if (!moved) togglePanel()
        }
        window.addEventListener('pointermove', onMove)
        window.addEventListener('pointerup', onUp)
      })
    }


    // ── 面板 ──
    function kpi(cls, label, value, sub) {
      return '<div class="am-kpi am-kpi-' + cls + '"><div class="am-kpi-label">' + esc(label) + '</div>'
        + '<div class="am-kpi-value">' + value + '</div><div class="am-kpi-sub">' + sub + '</div></div>'
    }
    function panelHtml() {
      var opts = state.sessions.map(function (s) {
        return '<option value="' + esc(s.sessionId) + '"' + (s.sessionId === state.selected ? ' selected' : '') + '>' + esc(shortId(s.sessionId)) + '</option>'
      }).join('')
      return '<div class="am-panel-header" data-am="drag">'
        + '<div class="am-panel-title">' + ICON_RADAR + '<span>' + esc(TEXTS.title) + '</span><span class="am-chip am-mono" data-am="ver">—</span></div>'
        + '<span class="am-chip am-chip-band" data-am="bandchip">—</span>'
        + '<span class="am-chip" data-am="statuschip">—</span>'
        + (state.sessions.length > 1 ? '<select class="am-select" data-am="session">' + opts + '</select>' : '')
        + '<div class="am-panel-actions">'
        + '<button class="am-btn am-btn-ico" data-am="ext" title="' + esc(TEXTS.openDashboard) + '">' + ICON_EXT + '</button>'
        + '<button class="am-btn am-btn-ico" data-am="min" title="' + esc(TEXTS.collapse) + '">' + ICON_MIN + '</button>'
        + '<button class="am-btn am-btn-ico" data-am="close" title="' + esc(TEXTS.close) + '">' + ICON_X + '</button>'
        + '</div></div>'
        + '<div class="am-offline" data-am="offline" style="display:none"></div>'
        + '<div class="am-kpis">'
        + kpi('band', TEXTS.band, '<span data-am="bandv">—</span>', '<span data-am="bandsub">—</span>')
        + kpi('score', TEXTS.score, '<span class="am-mono" data-am="scorev">—</span><span data-am="trend">─</span>', '<span data-am="scoresub">—</span>')
        + kpi('win', TEXTS.windowAgg, '<span class="am-mono" data-am="winv">—</span>', '<span data-am="winsub">—</span>')
        + kpi('base', TEXTS.baseline, '<span class="am-mono" data-am="basev">—</span>', '<span data-am="basesub">—</span>')
        + kpi('iv', TEXTS.interventions, '<span class="am-mono" data-am="ivv">—</span>', '<span data-am="ivsub">—</span>')
        + '</div>'
        + '<div class="am-chart-wrap"><canvas class="am-chart" data-am="chart"></canvas></div>'
        + '<div class="am-grid">'
        + '<div class="am-box"><div class="am-box-title">' + esc(TEXTS.events) + '</div><div class="am-events" data-am="events"></div></div>'
        + '<div class="am-box"><div class="am-box-title">' + esc(TEXTS.records) + '</div><div class="am-events" data-am="records"></div></div>'
        + '</div>'
        + '<div class="am-panel-footer"><span data-am="foot"></span></div>'
        + '<div class="am-resize" data-am="resize"></div>'
    }
    function ensurePanel() {
      if (panelEl) return
      panelEl = document.createElement('div')
      panelEl.className = 'am-panel'
      panelEl.innerHTML = panelHtml()
      panelEl.style.left = geomPanel.left + 'px'
      panelEl.style.top = geomPanel.top + 'px'
      panelEl.style.width = geomPanel.width + 'px'
      panelEl.style.height = geomPanel.height + 'px'
      overlayHost.appendChild(panelEl)
      chartCanvas = panelEl.querySelector('[data-am=chart]')
      bindPanelUi()
      updatePanel()
    }
    function removePanel() {
      if (panelEl) { panelEl.remove(); panelEl = null; chartCanvas = null }
    }

    function updatePanel() {
      if (!panelEl) return
      var snap = state.snapshot
      var p = latestPoint()
      var band = currentBand()
      panelEl.querySelector('[data-am=ver]').textContent = 'v' + (state.version || '—')
      var bc = panelEl.querySelector('[data-am=bandchip]')
      bc.textContent = BAND_NAMES[band]
      bc.className = 'am-chip am-chip-band am-cb-' + band
      var sc = panelEl.querySelector('[data-am=statuschip]')
      if (state.monitorOnline) {
        sc.textContent = TEXTS.monitorOnline
        sc.className = 'am-chip am-status-ok'
      } else {
        sc.textContent = TEXTS.monitorOffline
        sc.className = 'am-chip am-status-off'
      }
      var off = panelEl.querySelector('[data-am=offline]')
      if (state.monitorOnline) {
        off.style.display = 'none'
      } else {
        off.style.display = 'block'
        off.textContent = state.lastError || TEXTS.startHint
      }
      var ratio = p && p.ratio != null ? p.ratio : null
      var bandV = panelEl.querySelector('[data-am=bandv]')
      bandV.textContent = BAND_NAMES[band]
      bandV.className = 'am-band-text am-bt-' + band
      panelEl.querySelector('[data-am=bandsub]').textContent = ratio == null
        ? 'ratio —'
        : 'ratio ' + ratio.toFixed(2) + ' · 阈值 ' + state.thresholds.specMax + '/' + state.thresholds.reactMin
      var score = currentScore()
      panelEl.querySelector('[data-am=scorev]').textContent = score == null ? '—' : score.toFixed(1)
      var trendEl = panelEl.querySelector('[data-am=trend]')
      var trend = p ? p.trend : 'stable'
      trendEl.textContent = trend === 'rising' ? '▲' : trend === 'falling' ? '▼' : '─'
      trendEl.className = 'am-trend-' + trend
      panelEl.querySelector('[data-am=scoresub]').textContent = p
        ? 'raw ' + p.score.toFixed(1) + ' · #' + p.sequence
        : TEXTS.noData
      var agg = snap && snap.window ? snap.window.aggregate : { positive: 0, negative: 0, neutral: 0 }
      panelEl.querySelector('[data-am=winv]').textContent = agg.positive.toFixed(0) + '/' + agg.negative.toFixed(0) + '/' + agg.neutral.toFixed(0)
      var b = snap ? snap.baseline : { mean: null, std: null, samples: 0 }
      panelEl.querySelector('[data-am=basev]').textContent = b.mean == null ? '—' : b.mean.toFixed(1)
      panelEl.querySelector('[data-am=basesub]').textContent = (b.std == null ? '±—' : '±' + b.std.toFixed(1)) + ' · ' + b.samples + ' ' + TEXTS.samples
      var iv = { L1: 0, L2: 0, L3: 0 }
      if (snap) {
        snap.interventions.forEach(function (i) { iv[i.level] = (iv[i.level] || 0) + 1 })
      }
      panelEl.querySelector('[data-am=ivv]').textContent = iv.L1 + '/' + iv.L2 + '/' + iv.L3
      panelEl.querySelector('[data-am=ivsub]').textContent = TEXTS.attempts + ' ' + (snap ? snap.l2Attempts : 0) + '/' + state.maxL2Attempts + ' · ' + TEXTS.cooldown + ' L2 ' + (state.cooldowns.L2_ms / 1000).toFixed(0) + 's'
      var eventsEl = panelEl.querySelector('[data-am=events]')
      var recEl = panelEl.querySelector('[data-am=records]')
      if (state.events.length) {
        var rows = []
        var n = state.events.length
        for (var i = Math.max(0, n - 10); i < n; i++) {
          var l = eventLabel(state.events[i])
          if (!l) continue
          var cls = state.events[i].type === 'intervention_triggered' ? ' k-iv' : state.events[i].type === 'threshold_check' ? ' k-th' : ''
          rows.push('<div class="am-event' + cls + '"><span class="am-mono">' + fmtTime(state.events[i].timestamp) + '</span><span>' + esc(l) + '</span></div>')
        }
        eventsEl.innerHTML = rows.length ? rows.join('') : '<div class="am-empty">' + esc(TEXTS.noData) + '</div>'
      } else {
        eventsEl.innerHTML = '<div class="am-empty">' + esc(state.monitorOnline ? TEXTS.noData : TEXTS.monitorOffline) + '</div>'
      }
      if (snap && snap.interventions && snap.interventions.length) {
        var list = snap.interventions.slice().reverse().slice(0, 8)
        var ivRows = []
        list.forEach(function (i) {
          ivRows.push('<tr><td><span class="am-badge am-badge-' + i.level + '">' + i.level + '</span></td>'
            + '<td>' + esc(i.reason) + '</td>'
            + '<td class="am-mono">#' + i.sequence + '</td>'
            + '<td class="am-mono">' + fmtTime(i.timestamp) + '</td></tr>')
        })
        recEl.innerHTML = '<table class="am-table"><tbody>' + ivRows.join('') + '</tbody></table>'
      } else {
        recEl.innerHTML = '<div class="am-empty">' + esc(T('暂无干预 — 轨迹稳定在 spec 带', 'No interventions — stable in the spec band')) + '</div>'
      }
      panelEl.querySelector('[data-am=foot]').textContent = 'config ' + state.configHash + ' · ' + state.monitorUrl
      drawChart()
    }

    // ── 图表 ──
    function hexA(hex, a) {
      var r = parseInt(hex.slice(1, 3), 16)
      var g = parseInt(hex.slice(3, 5), 16)
      var b = parseInt(hex.slice(5, 7), 16)
      return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')'
    }
    function dashLine(ctx, y, pad, plotW, color, label) {
      ctx.strokeStyle = color
      ctx.globalAlpha = 0.7
      ctx.setLineDash([5, 4])
      ctx.beginPath()
      ctx.moveTo(pad.l, y)
      ctx.lineTo(pad.l + plotW, y)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.globalAlpha = 1
      ctx.fillStyle = color
      ctx.font = '9px monospace'
      ctx.textAlign = 'left'
      ctx.fillText(label, pad.l + 5, y - 3)
    }
    function drawChart() {
      if (!chartCanvas) return
      var snap = state.snapshot
      var dpr = window.devicePixelRatio || 1
      var W = chartCanvas.clientWidth || 640
      var H = chartCanvas.clientHeight || 248
      chartCanvas.width = Math.round(W * dpr)
      chartCanvas.height = Math.round(H * dpr)
      var ctx = chartCanvas.getContext('2d')
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = isDark() ? 'rgba(15,18,30,0.4)' : 'rgba(249,250,253,0.55)'
      ctx.fillRect(0, 0, W, H)
      var hist = snap && snap.history ? snap.history : []
      if (!hist.length) {
        ctx.fillStyle = isDark() ? '#5b6585' : '#98a2b3'
        ctx.font = '12px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(TEXTS.noData, W / 2, H / 2)
        return
      }
      var pad = { l: 38, r: 10, t: 10, b: 18 }
      var plotW = W - pad.l - pad.r
      var plotH = H - pad.t - pad.b
      var n = hist.length
      var yOf = function (v) { return pad.t + plotH * (1 - Math.min(100, Math.max(0, v)) / 100) }
      var xOf = function (i) { return pad.l + (n === 1 ? plotW / 2 : (i / (n - 1)) * plotW) }
      ctx.font = '9px monospace'
      ctx.textAlign = 'right'
      for (var g = 0; g <= 100; g += 25) {
        var gy = yOf(g)
        ctx.strokeStyle = isDark() ? 'rgba(148,163,215,0.10)' : 'rgba(15,23,42,0.08)'
        ctx.beginPath()
        ctx.moveTo(pad.l, gy)
        ctx.lineTo(W - pad.r, gy)
        ctx.stroke()
        ctx.fillStyle = isDark() ? '#5b6585' : '#98a2b3'
        ctx.fillText(String(g), pad.l - 6, gy + 3)
      }
      var stripW = Math.max(1, plotW / n)
      for (var i = 0; i < n; i++) {
        ctx.fillStyle = hexA(BAND_COLORS[hist[i].band] || BAND_COLORS.unknown, 0.10)
        ctx.fillRect(xOf(i) - stripW / 2, pad.t, stripW, plotH)
      }
      dashLine(ctx, yOf(state.thresholds.safetyFloor), pad, plotW, isDark() ? 'rgba(248,113,113,0.6)' : 'rgba(220,38,38,0.55)', 'floor ' + state.thresholds.safetyFloor)
      if (snap.baseline && snap.baseline.mean != null) {
        dashLine(ctx, yOf(snap.baseline.mean), pad, plotW, isDark() ? 'rgba(232,236,248,0.5)' : 'rgba(77,107,254,0.55)', 'μ ' + snap.baseline.mean.toFixed(0))
      }
      var grad = ctx.createLinearGradient(pad.l, 0, W - pad.r, 0)
      grad.addColorStop(0, '#4d6bfe')
      grad.addColorStop(1, '#22d3ee')
      ctx.strokeStyle = grad
      ctx.lineWidth = 1.8
      ctx.lineJoin = 'round'
      ctx.beginPath()
      for (var i2 = 0; i2 < n; i2++) {
        var x = xOf(i2)
        var y = yOf(hist[i2].normalizedScore)
        if (i2 === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
      if (snap.interventions) {
        var seqToX = {}
        hist.forEach(function (pp, i3) { seqToX[pp.sequence] = xOf(i3) })
        snap.interventions.forEach(function (iv) {
          var ix = seqToX[iv.sequence]
          if (ix === undefined) return
          var color = iv.level === 'L1' ? '#d97706' : iv.level === 'L2' ? '#4d6bfe' : '#dc2626'
          ctx.fillStyle = color
          ctx.strokeStyle = isDark() ? 'rgba(7,10,20,0.9)' : '#ffffff'
          ctx.lineWidth = 1.4
          ctx.beginPath()
          ctx.arc(ix, pad.t + plotH * 0.5, 4.5, 0, Math.PI * 2)
          ctx.fill()
          ctx.stroke()
          ctx.fillStyle = color
          ctx.font = '8.5px monospace'
          ctx.textAlign = 'center'
          ctx.fillText(iv.level, ix, pad.t + plotH * 0.5 + 13)
        })
      }
    }

    // ── 面板拖拽 / 缩放 / 按钮 ──
    function bindPanelUi() {
      var dragEl = panelEl.querySelector('[data-am=drag]')
      if (dragEl) {
        dragEl.addEventListener('pointerdown', function (ev) {
          var startX = ev.clientX
          var startY = ev.clientY
          var left0 = geomPanel.left
          var top0 = geomPanel.top
          var moved = false
          var onMove = function (e2) {
            var dx = e2.clientX - startX
            var dy = e2.clientY - startY
            if (Math.abs(dx) + Math.abs(dy) > 4) moved = true
            if (!moved) return
            geomPanel.left = Math.max(4, Math.min(left0 + dx, window.innerWidth - geomPanel.width - 4))
            geomPanel.top = Math.max(4, Math.min(top0 + dy, window.innerHeight - geomPanel.height - 4))
            panelEl.style.left = geomPanel.left + 'px'
            panelEl.style.top = geomPanel.top + 'px'
          }
          var onUp = function () {
            window.removeEventListener('pointermove', onMove)
            window.removeEventListener('pointerup', onUp)
            persistGeoms()
          }
          window.addEventListener('pointermove', onMove)
          window.addEventListener('pointerup', onUp)
        })
        dragEl.addEventListener('dblclick', function () { setPanelOpen(false) })
      }
      var resizeEl = panelEl.querySelector('[data-am=resize]')
      if (resizeEl) {
        resizeEl.addEventListener('pointerdown', function (ev) {
          var startX = ev.clientX
          var startY = ev.clientY
          var w0 = geomPanel.width
          var h0 = geomPanel.height
          var onMove = function (e2) {
            var g = clampPanel({
              left: geomPanel.left,
              top: geomPanel.top,
              width: w0 + (e2.clientX - startX),
              height: h0 + (e2.clientY - startY)
            })
            geomPanel.width = g.width
            geomPanel.height = g.height
            panelEl.style.width = g.width + 'px'
            panelEl.style.height = g.height + 'px'
            drawChart()
          }
          var onUp = function () {
            window.removeEventListener('pointermove', onMove)
            window.removeEventListener('pointerup', onUp)
            persistGeoms()
          }
          window.addEventListener('pointermove', onMove)
          window.addEventListener('pointerup', onUp)
        })
      }
      var ext = panelEl.querySelector('[data-am=ext]')
      if (ext) ext.addEventListener('click', function () { window.open(state.monitorUrl || 'http://127.0.0.1:9301', '_blank', 'noopener') })
      var min = panelEl.querySelector('[data-am=min]')
      if (min) min.addEventListener('click', function () { setPanelOpen(false) })
      var close = panelEl.querySelector('[data-am=close]')
      if (close) close.addEventListener('click', function () { setPanelOpen(false) })
      var sel = panelEl.querySelector('[data-am=session]')
      if (sel) {
        sel.addEventListener('change', function () {
          state.selected = sel.value || null
          pollOnce()
        })
      }
    }

    return module.exports
  },
})

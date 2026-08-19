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
    var LANG_KEY = 'dsh-anchored-monitor.lang'
    function savedLang() { try { return localStorage.getItem(LANG_KEY) } catch (e) { return null } }
    var langZh = savedLang() === 'zh' ? true : savedLang() === 'en' ? false : LANG_ZH
    var T = function (zh, en) { return langZh ? zh : en }

    function buildTexts() {
      return {
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
        of: T('次', 'of'),
        switchLang: T('切换语言', 'Switch language'),
        ivOn: T('干预: 开', 'Intervene: ON'),
        ivOff: T('干预: 关', 'Intervene: OFF'),
        ivSwitchTitle: T('切换干预(关闭=只监控不打断)', 'Toggle interventions (off = monitor-only)'),
        monitorOnly: T('仅监控', 'monitor-only'),
        updateAvailable: T('发现新版本 v{latest}(当前 v{current})', 'Update available: v{latest} (current v{current})'),
        updateNow: T('去更新', 'Update'),
        updateLater: T('忽略', 'Dismiss'),
        welcomeTitle: T('欢迎使用锚定监控 👋', 'Welcome to Anchored Monitor 👋'),
        welcomeSub: T('一句话：这是给 DeepSeek V4 Pro 加的一根鞭子——从 We need / I will 的高专注模式跌落到 let me 的低效模式时，就抽它一鞭让它改回去。', 'One sentence: a whip for DeepSeek V4 Pro — when it falls from the focused We need / I will mode into the scattered let me mode, the whip cracks and pulls it back.'),
        welcomeStep1: T('① 左侧栏底部点「锚定监控」打开实时面板', '① Open the live panel from the left sidebar footer'),
        welcomeStep2: T('② 收起时是变阻器条：滑条=思考强度，右侧=实时日志', '② Collapsed: rheostat bar — slider = thinking intensity, right = live log'),
        welcomeStep3: T('③ 面板右上可一键关闭干预(只监控)；干预建议仅在 DeepSeek V4 Pro 0813 时开启', '③ Toggle interventions off in the panel (monitor-only); recommended only for DeepSeek V4 Pro 0813'),
        welcomeBtn: T('开始使用', 'Get started'),
        ivHintOn: T('提示: 干预模式建议仅在 DeepSeek V4 Pro 0813 时开启, 其他模型请关闭(只监控)', 'Tip: keep interventions on only for DeepSeek V4 Pro 0813; turn them off (monitor-only) for other models'),
        ivHintOff: T('提示: 仅监控模式 — 除 DeepSeek V4 Pro 0813 外建议保持关闭', 'Tip: monitor-only — recommended unless you are on DeepSeek V4 Pro 0813'),
        skin: T('皮肤', 'Skin'),
        skinDesc: T('仅保存在本机浏览器, 即时生效。表情素材来自 Lichtspektrum/liang-intensity-calibrator (MIT)。', 'Saved locally in your browser, applies instantly. Face assets from Lichtspektrum/liang-intensity-calibrator (MIT).'),
        skinSerious: T('严肃皮肤', 'Serious skin'),
        skinSeriousDesc: T('默认皮肤: 理性的变阻器条, 不整活。', 'Default: the sober rheostat bar.'),
        skinMeme: T('梗皮肤', 'Meme skin'),
        skinMemeDesc: T('变阻器条变身「滑动变祖器」: 表情小气泡浮在强度圆圈上方, 随强度从夯到拉切换梁文锋表情并脉冲发光。', 'The bar becomes the "Liang-o-meter": a face bubble floats above the intensity knob, flipping Liang Wenfeng faces from focused to slacking as intensity rises, with a pulsing glow.'),
        memeTitle: T('滑动变祖器', 'Liang-o-meter'),
        cotLeak: T('CoT 泄漏', 'CoT leak'),
        cotStall: T('CoT 停摆', 'CoT stall'),
        resetBtn: T('恢复默认', 'Reset to defaults'),
        resetConfirm: T('确定把全部监控参数恢复为默认值? 自定义的窗口/词典/评分/阈值/冷却等设置会被清除。', 'Reset all monitor parameters to defaults? Custom window / lexicon / scoring / threshold / cooldown settings will be cleared.'),
        resetDone: T('已恢复默认参数', 'Reset to defaults'),
        resetFail: T('恢复失败: ', 'Reset failed: '),
        resetBtnTitle: T('一键还原出厂默认参数(防止改乱)', 'One-click restore of default parameters')
      }
    }
    var TEXTS = buildTexts()
    function setLang(zh) {
      langZh = !!zh
      try { localStorage.setItem(LANG_KEY, zh ? 'zh' : 'en') } catch (e) {}
      var fresh = buildTexts()
      for (var key in fresh) TEXTS[key] = fresh[key]
      if (typeof removePanel === 'function' && panelEl) removePanel()
      emit()
    }
    function toggleLang() { setLang(!langZh) }
    // 表情素材直接以 base64 data URI 内嵌(LIANG_DATA 由 assemble 脚本从 assets/liang/*.png 生成),
    // 不依赖任何网络/路由加载 — 本地永远可用。
    function setSkin(skin) {
      state.skin = skin === 'meme' ? 'meme' : 'serious'
      try { localStorage.setItem(SKIN_KEY, state.skin) } catch (e) {}
      if (barEl) { removeBar(); ensureBar(); updateBar() }
      emit()
    }
    function liangIdx(score) {
      if (score == null) return 0
      var pct = Math.max(0, Math.min(100, Number(score)))
      return Math.round(pct / 100 * 5)
    }
    function liangData(i) {
      return (LIANG_DATA || {})[i] || ''
    }
    function liangUrl(score) {
      return liangData(liangIdx(score))
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
      triggers: { mixed: true, react: true, sigma: false, percentile: false, floor: false },
      cooldowns: { L1_ms: 0, L2_ms: 0, L3_ms: 0 },
      maxL2Attempts: 5,
      sessions: [],
      selected: null,
      snapshot: null,
      events: [],
      lastError: '',
      update: { current: '', latest: '', hasUpdate: false, show: false, dismissedFor: '', releaseUrl: '', npmUrl: '' },
      welcome: false
    }
    var WELCOME_KEY = 'dsh-anchored-monitor.welcomed'
    var UPDATE_DISMISS_KEY = 'dsh-anchored-monitor.update.dismissed'
    try { state.welcome = localStorage.getItem(WELCOME_KEY) !== '1' } catch (e) { state.welcome = true }
    var SKIN_KEY = 'dsh-anchored-monitor.skin'
    try { state.skin = localStorage.getItem(SKIN_KEY) === 'meme' ? 'meme' : 'serious' } catch (e) { state.skin = 'serious' }

    // 0.3.0: 跟随当前活跃对话。优先用壳的 sessions.list.getSnapshot().current(DSH 面板正在打开的会话);
    // 服务不可用或 id 命名空间对不上时, 兜底跟随「最近 30s 仍产生思维链/正文推送的会话」(你正在对话的那个自然最活跃)。
    // 手动在下拉中点选后 8s 内不自动覆盖, 尊重临时查看。
    var sessionsSvc = null
    var lastGuiActive = null
    var lastManualAt = 0
    var MANUAL_IMMUNITY_MS = 8000
    function currentGuiActive() {
      try {
        if (!sessionsSvc || !sessionsSvc.list || typeof sessionsSvc.list.getSnapshot !== 'function') return null
        var snap = sessionsSvc.list.getSnapshot()
        return snap && typeof snap.current === 'string' && snap.current ? snap.current : null
      } catch (e) { return null }
    }
    function sessionInList(id) { return !!(id && state.sessions.some(function (s) { return s.sessionId === id })) }
    function mostRecentActive(withinMs) {
      var cutoff = Date.now() - (withinMs || 30000)
      var best = null
      for (var i = 0; i < state.sessions.length; i++) {
        var s = state.sessions[i]
        if (s.lastActivityAt >= cutoff && (!best || s.lastActivityAt > best.lastActivityAt)) best = s
      }
      return best ? best.sessionId : null
    }
    function followActiveSession() {
      try {
        if (Date.now() - lastManualAt < MANUAL_IMMUNITY_MS) return null
        var viaSvc = null
        if (sessionsSvc) {
          var cur = currentGuiActive()
          if (cur) {
            viaSvc = cur
            var changed = cur !== lastGuiActive
            lastGuiActive = cur
            if (sessionInList(cur)) {
              if (state.selected == null || changed) {
                if (state.selected !== cur) { state.selected = cur; emit() }
              }
              return cur
            }
          }
        }
        var rec = mostRecentActive(30000)
        if (rec && state.selected !== rec) { state.selected = rec; emit() }
        return rec || viaSvc || null
      } catch (e) { return null }
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
    var POLL_MS = 500
    var pollTimer = null
    async function pollOnce() {
      try {
        followActiveSession()
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
          state.triggers = j.triggers || state.triggers
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
        case 'guard_triggered': return (e.guard === 'text_leak' ? '🧠 ' + TEXTS.cotLeak : '⏸ ' + TEXTS.cotStall) + ' · ' + e.detail
        case 'session_start': return T('会话启动', 'Session start') + ' · ' + shortId(e.sessionId)
        case 'session_end': return T('会话结束', 'Session end') + ' · ' + e.reason
        default: return null
      }
    }

    // ───────────────────────── 更新检测轮询 ─────────────────────────
    var UPDATE_POLL_MS = 12 * 3600 * 1000
    function startUpdatePoll() {
      var tick = function () {
        fetch('/api/anchored-monitor/update-check', { cache: 'no-store' }).then(function (r) { return r.json() }).then(function (j) {
          if (j && j.ok) {
            state.update.current = j.current || ''
            state.update.latest = j.latest || ''
            state.update.hasUpdate = !!j.hasUpdate
            state.update.releaseUrl = j.releaseUrl || ''
            state.update.npmUrl = j.npmUrl || ''
            if (j.hasUpdate && state.update.dismissedFor !== j.latest) state.update.show = true
            emit()
          }
        }).catch(function () {})
      }
      setTimeout(tick, 6000)
      setInterval(tick, UPDATE_POLL_MS)
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
      try { sessionsSvc = ctx.sessions || null } catch (e) { sessionsSvc = null }
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
      try {
        slots.inject('settings.section', function () {
          return slots.register({ name: 'settings.section', id: 'anchored-monitor', order: 30, label: TEXTS.title }, function (props) { return h(SettingsPage, { close: props && props.close }) })
        })
      } catch (e) { console.warn('[dsh-anchored-monitor] settings slot failed', e) }
      // 订阅 GUI 会话切换: 活跃对话变化立即跟随(面板/悬浮条随之切换)
      try {
        if (sessionsSvc && sessionsSvc.list && typeof sessionsSvc.list.subscribe === 'function') {
          sessionsSvc.list.subscribe(function () { followActiveSession() })
        }
      } catch (e) { /* sessions 服务不可用则退化为固定会话 */ }
      startPolling()
      startUpdatePoll()
      console.log('[dsh-anchored-monitor] client ready: sidebar entry + liquid-glass overlay + rheostat bar + settings page')
    }

    exports.inject = ['slots', 'sessions']
    exports.apply = apply

    // LIANG_DATA: 由 assemble 脚本自动生成(assets/liang/*.png → base64 data URI), 勿手改。
    var LIANG_DATA = {
      0: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAEguSURBVHhebX13XFXXtq4nzYoC0qsNxa6JMeYkRmOiJjHFRE00Gk3sFbE3QEVUpAiKYkVAihWVIr33Jl0Ue0057Z5z7rvn3nfeu/d7vzHmHGsvPe+P+Vt7r73W2nN+3xjfGHPMuaFTfnHZpw1NN4NLSsqDS8oq1bGkMrioqNxo6nxlcFmZ5Ty9Vq2aG18jrUSeY2762vJadT1fY7m/rFydo2eaP1N9KQsuKqHv1NeZrymX73/xPF1v+fylvul+U794fHIPjU331zx+OldQVBacV1CiPmccyoILCsr42ry8kuCcvBJ+T59b7lX38Hl9PT2Hjjk5RcH19S3BnQoLK6IeP/kVLa0daGm9jabmdjQ33+JjU1M7GptuqnMtt9Tn9L7pJppbbvN11FpbO9DUTOfUNfwZvZbG5+jYgda2O3yk9+oadX1rG33Wwc+i80307JbbaKQ+NKo+SD/M390sfWuRvr/YbxkP30fjaqLPVV/pmoaGNv4ONWZ1zvx9/L7pJupvtKC+vkV91tSOGzfodRuam2/iRkMr6uqb+Rr+7sab/Dmdp2NdPd3brNqNVn19C+7ee4JOxBTdVFxShZJSatUoLa3iVlJSidLSahQVV/DrsrIaPnIrreLzRcXlKCuvQWmZ3F+F0rJq9ZrvoedV8zl1nX6+6X1xSSU3dT99p7qXz3Gj/qj75HO5X31eYTyLnqHuU30pLq7gJv0pKipX5+j5xfSajhUoKtLX8HVq/NToOrqnsLBMtSI5lvPYqalnVaCwUL8uqUSBXG/cp64tKChFXn4J8vNLUVvbpAggKyAw1QDVYBk43dQ5GjR1SHWeiDJ31riGz6lnWUip1MAr0IRIuqa8vJbPC3A0EAH45XPq3n8lUEg3yNQAG8aiG/VdXguoBYWlyM8vYWAsRiAGoMgzg0n3EVl0lPsUuOqc5bllKCigVmpcQ+cI+Ly8EuTkFqG2ThNAHsCAiOXSYF8i4GVrtYCtQCLLoKMCVN1fbngGDUwNiJ5RXlGrn6+BJhJNACqPM5GgAVXXWK4VIsQAGDRt8QKIcZ/0Vz+PAFGglHJjEHWzEKYtWzyAxlhsIZDAZHKMz+mZGnwCm8G3kECE0T3UcnIKlQdQECH9Ux0UgLWlmC1QW7DZ2hQBqqPkXvS6jAgg69QWaj4SCfSaCJD7xXrkuQKQSIgBhIl08SzDYk1HZfnKMARIkUD5TgKRvvPl+5UhaYkSEvl1JcsLe8BLckbvxeLlPXuBtnjxHoMM43Upx4xOlCFQkDQDKpbEnSerNAHC4Jo0n0Hj61UsEOt++TXLjsgIa7cCyRiQeJ5JVuT7Se4MAjSQ4mHUyspfJFzA5HNl6vvoKPcLodJ/NixNmAGiBla8URmZxXMM2RHpMRFGZAnY9JoAz80rNghhjygs48DdidIvIoDAesGaDAAkJujBagCUZVkAo0byU1FZZ5zj9xV13GSgcq08W4BkUkwEyXXGsytqUFvbqDKLhlZ23+rqBvY4BYKyaPqu6pobqKyqVwBLH18gVDxJvIJI0YH5JRlTHqUwEas2rFtbskgdB3QKwCw3JovXuk9E8JGlqER5AEkQpVtsIaaAxpakA6wAYj6arcqwMrZIJS8MpknvxULZOnlgFQbwZl23fH8NKipqUVfXhIaGVh5ITEwCtm3fhUWLVuCbGXMw7fNv8P74j/DOuPF4590P8Oln0/HD/MXYtWs/Lly8hqqqG0ruTPov4zH6z9+rxmGAbrJ0PldkCcQcUEmOJAiz9ChvoaYIINBLjLhgfs8ZkI4HlPx0Kiqp1EFYW7pZAjS4KpgqUCwEaB03gWsZkD5v0nsZNAEvqZucM+7RVkrnCPjqmgYkJF7EihW+GPfuBLi69UWPnr3RvYcNXn+jO373yhv43Suvq/bqG3j19a54o0sP9OxlhwFeQzF/wRKcv3CVn1NVfcMwBOmzjFE8kyXoJRJEYtjSNRlEgPlIlm+OASrwKvmicwQ6NSNDKihjT6B5hSKAgrAJuJf1XoH7YmqqdFO5pkgN36vvI+BJjvi8DJTv/de01SCitIqlg+TlzJkktvI+fQfBzsEVdvYu6G3njJ7WdujWvRc6d+mOrt17wqqXLax69YZVz97o1r0nf0bnX+/cDa+93hWefbywdNkaXLyUajEQ03cL6ZxocL8o5pljgaSs4hESCxQBKmaqWGZ8psng4K09gMnSpJL1EyF1dRIDWm5rS6zR8qCzlfJaJSFipS9kExYC5FoJVmJhEgTNBAjYhvVp+aFzpO1Z2YX4Yf4SePYdCAdHd7i594ODk5sBfi9rO9j0doRNbyfY2Dqiew9rBr1bD2t06WqFLl174I0u3dG5aw9u5Bmvvd4N3oNH4kBIJFssGQZ5BR1FelRMswRwAdQiReo1p6m67zwf0HIq9zBxRnakU1VNgDrqmJBfghs3WikLquYgLCCroPOirr/cjDRSZIaIMmm/ucnnZnni9yb5IaunOHT8RCzGjH2Prd2jjxc8PAfAydkD9g6uTAJ5AoFPoBvNyoYJeKNzN7z+Rle89npnvPraG+jarQeT0bVbTyana/deGOQ9AmFhRxB15CSSki5z/0iaZO5iAK+DsQAulvtCXDDOmTMfCsimazUBEivMEzQioJY8QBHQwdavdFEyAcmASGL+lQCWI5P8KJBflCkzieL6Ij30DGpkidR8122Buwacjq7u/eDm0Z9138WtL2ztnLhZ2zqgW49eyhNsHZgAsvjX3+iC117vwuATESRRRIySJ1tu1jYOcHB0g7vHAAwdOhrz5i3C6ZhEwwgkDWUv1qUWgwydkip5soAs1wghL3iCJkbkx+xRRITOgnQM0BIh4LMmakA5laysV8HYBJ7SUPW5ulfl9EKCITtMhDon1kPk0lScnjPn+x/ZugloApxIcHLx5EbnCDQ7BxeDAAKf5Iisu0s3K7Z+Ar9zlx4MOpFC50mC6EjXvdG5O3sEkUOviZjOXa3Qt98gLF3mg6ysQiZByg8yFoWH5TXFBAN8XZKwzBc0OUbtR5OjsyiVlqrrVRraik5UxqXqolitZClKQiQVVUHVnNGYYwMfZZZsBNsXJ1OGJ/BzK3mwpMEzZ82Fja0THJzcWXoIaGeXPnAk6XF0Q89evVl+yCPsHV1Z9ykeEBk9etoqErpasRz1srbn9yRDHKS79WQSCPTfvfIqB2e6jgI0PZfeK3myxuQpn+PqtUz2RsZAlySU5WoCzIFWEyD6rtJQmR9YCBBvEdmRa0iaDAJkJiyAciooIJoyIsOi/z9ypMC3yIzRYdMM1nwPzQJ//Gk5g09AE7AUWJkI0npbRwaYNJ88gQhR5x0YPCKArrElMno7ore9s2HhRIgiogteefV1lqXfvfIaewMRQMDTs+l68hYVV2zw+/c+RGpqFpPAqbIhLxYrlyBLNR9LpmSZ/QoZnPeLJEkhzqgJqcYEUAyg2jhXMBlI0XCdqUhQNmu5JomO5nigim4WAqRz8l7IaWhsw+7AYNgS4GTl1nYMIAFNwPaysWeJ6Gltz+fpGiKGNJwApPvIUyhGECH0ns4zwFbWBvgcDzp3NUiQbIkaEUCSpTzHjr2qu5Utpn7yJQNGklmkC4zK2su47wyqxAYemzJSCsZi+UyALjdwyVokyOQhdORqKHkAZSD0QLFiS76sHq40+6VJmhS9dKZjnOOjlh5J8USWSqs4x09MusSBloDrbe/CAJPskIUT+AQOHYkY8goigQghyyVPcHbtw2T1sLJWEuXoZgTj197owqCTDBERlP3Quc5duhmSRQGZXtMz6T4mQBPdtVsvLF+xlgOk2cplnkDjMIKuUQGVwGoJsCr9VFVWrpDqGbTMio15gHiAAthizSI/tFCjgrKFILM2qkCs4oUix1KRlKNkRxJHPpo8zbBuCrgEKMmQta0jrHrZ8ZHA57zfxkHJRTcrlgqyfCLBmgnqzUGbJmNk8QQ8aT9JEBFDFk/P6N6jF1s6zZAJcCKB3js6q7hDaS49lwigIE/PPHcuBVVV9YaWE6gqBljK08rKNciSYpqqn0SCCtSWiimBT2sBVJzjLKi8vFanoQK6khZjBssEWApTYtUqXbMslBhB2RQvXrD+siqeaO3bHw57R3fObghICq7k/vSavIG8gKSGwCILJfAFSDpPnqG8Q1k+nSctJ6um+1nWnNzh6OTOn1HgFi8jAolQIpNSWVc3lerSd9M91A+6jsoZ3343j5cQJTUVAiwB2JKGyjmzzgsZkgUZgTivhBuXo6kUQR5Aa7HG6pUxC1ayoiqFlgmKQYqpciixQEigZr6HrldpazXGf/CxynKcPIzBCxnOrpSCejKIYvlkrT2sbBhgkhPlFfZcdiBJksBNXkSA0pEmcX36DmQSets5wdnFk2fUdB9ZvMQTApwney6efB99Rh5A3+vh6cUBubKy7oVgbJYeA1yTFElaKvGArjE8g8oQuhBHcmQEYSpFiNUqqdAlZV2ME9DN1i0WbkjRS6mmea2USCVrohmom8cAPdHqz9ZPzcmlD4Pv4kappsqClBwpjZa8noAhAkjru/AMtxcTIJM0lhKqGdk7q+eSVNk6GLJFBFBK27e/t5a9F+ceEoPons5drBAQEMSVWIltsqYrRCi50RmSqVxB+i6AG4SZZsF8T1G5lCIqg2kngbJ2rdemYPsysEqqLOVbIUPuN2ICd9pSW6e0c+HilTwLJQL69PNmK2PL40kYgU8TLjclJZwN0aRLBWXSbCKEtJ48QSZYRARLip6AyZHuoecQsJziclMpLFk8eQl5CJFGJNB1RA7JFMkfEfD5F9/wGoTEPFluVIalF9611YskSb7P6aYRhIUk0wyZCGjQHkBbRaQ+8zLo9OX0hUaubwrS5iYECOBGRlRaxROunNxiTJg4FQO9R7AFEgFeA4fBxbUPXFz7wsHJgyWBPIS8gSxbgrGySkcjvydJohSSZrKS9/Osl4tx6jXpuK2tPfo5u8Cmly1setnAltLbHiozIq/geKJTUGdXTyaEiJI0eNTod5BfUMZjV9Yss1/J/V+UHpEaI/BKycJUSVVeoFbIOAsqr6wPbmu7YwFVrwmo8gOVGBSohmWLlWvgpd6jSNA5s2i/vo5q+ydPxmH4iLcxbMTb6O81lKuT/b2GsBf06TeYJ1TkAUOGvsUEkCeQNPW2pwzFVXkBp4xqtste0NVKyRGDrpryiJ54rXN3uNj2xuSRQ2Bvawc3O3vY2djBrhelq6pIR/eJx6hg7cwEkJdQjCDjOH/hCiqr6oyUVGKb5PJizWqGa6n7GIFXy468l/SUvEMToLMgU6lZAJVytLJkWeD+Vy9gLxGrN2dNOjZQuuUfEATvIaPgNWg4hg4bg1FvjmMiPPoMZAkgwN09veA1cDhLB8UIkiVHHZTJIwh8qvuLxPCsVgOuZMlyJDJmjBuNbTOmwtHWDkM8PeDp7AJPR1VN5XJ1F+U19Dx6Llk+fRdJkMq67BERcRQ1NQ2GhEjglWxHAGdwdeopBTgjKzLPF0yfqfUAWpRvUWvCRiYjS40v1XyU9et1AFOubwm2aj4g56hj9BzS/8VLVqNv/8FMwIhR72hvGKO019Gdge43YIgOyqoQp2IClaLd+TXFBBUfaG3AHnZ2jiwhMruVme7rXa0Y8LPrf0Lwgq8xzNMDk0YMwVjvQRjg6goHW3t079lbESblapI2PQFkCdKTtS1bAzgOMAF6jAQkr3Lx+q4CXHY9mIG2zID1gozJK9gDKA0tKVHlaLX0WIvKynpuEhNUemrZEmLECe0B9Frkxpz1qPRTpbQkZV9+NQt9+3ljwMBh8B4yGsOGj8HAQcMZTLJ2Sj/JGyQdJYun5UfSagralN3QtX09+8OVMhgndwzqq+YQEifoSNr9RndrLP3sIzQdD0TEoln4ZtxofPve2/jq3TF408sLXm7usLFzZo8yZ1kiR0SqOtcTa3w2oqa20TIj1qUJkRGxerXbreQFSTImZBKQtfVLRmRJQ3kipmTFbPUceDWo9MWGPJnl56VsSCZo/F4Hb7r308++5gBLYA/yHon+A4aoCZOzO4NP2RCBRwRQIxnoYWXL59V8wRPu7v0wbvhweHt5w7vfALzl7Y3eDq7GRIq9xNYRbs5uOLtlOe4lRCBl+zKEzP8KW76egrVffowvxr2FMQO99NzDU2VaNvY8meMakZUtf7da2uwFn7UbuXyigq4CjyVExwBVXFNpp5QeJCuiayjYCkkiR3ItL8rTbuWbN++qiZKR1ejdC1yaNoGva0Ri8ZJq0msJxmpTlwTsSiOGfPTxNAaIwKRGQY7khcDjwEea28uWJ0zWpMM9beBo58ifOzm6wtG1L0YNGYqv3x+HoQO98f6okRg7bBgcXPqwhzi79YWnBy1feuCdYcNQe2wvbsWGoCZyO9L8lyN+7XycWDkHy6d+gI9HDYOHRz+4eqhJGHkRxQPyCJlx01yAytQ+azexhBIODLSklpoIOfevaadlMd44Z6oTUeN5AMUAqgWx5ZuWCmUroQH2S1JjBGQNNB91AObaka6uqn1CtZgy9UsmgORFZpsc9HT1kyyOA6VHP04zPezt4erkCic7B/Rz94Stozu+fPdtzJv0Ht4cOgyfvTsWo4YMg5MbTeb6w8XFAx8MGwIPF3fMmDge7XFh6DgbgY7YEFQe3ILSkA1ID1iBwDnTsHzKeDjZO8LOiWbhNCHsr6qiNvZMBsUZek0lan//PUyAyIkhIVJy0FsPJQaI5SurVwRYSFNZUK4uR6j1AF4Ra7fIi67bWCZkFm+QJsU1cwzgoKuDjJGG6loR1ddnffuDsaYrxTA1WXJGNysbzk4+HzeGs5Chnh4YN3gQe8D7g70w0LMvnBycsfWbKVg0eTymjBmNqW+P5njgSGUEJzdONynj8XRxw4ovp+J+QgTuJhxCR1womo/vQtOxnag5tA0xq79HyA9fwtPOHp279+L5BRkFp6A8q3aGnaOuylr1RkjoIUWAKc83shsddOW9zAtU0LV4iDEz5mBtiQs8ERMPEAIEWPEI3ikhFq/jhLEGbNrdILNeCVaGROkyxIqVvqq8TGu6ehGdSgmk+5QKThk9HHOmfAQHaxssm/I+hvfrj/cHD8Smrz6Cu6MzPhg6iCUkYNan+GHiOEwYPgQu9o5wdXTBxGHeSPD5AWdWzcUoT3dsn/0FHp87jLtnw3EnPhRtp4LQdjIQDUf9kOG/DGd95uKjYYPQ6ZU3OB0lCSTpsndQM2EigYih+HA0+rRKQ82bbvUmK1X30WmlxARTymmWGyFA7leL8no9QHZFmItpKtgqwJWF68qmXi8Qb7FIlqyZqhmjigWKAPIA2hJCAyISunazwquvdcYbXbrhtTe6wcaqF5Z8OgkDXN2wddan2D3va0wYOghRi75B2Pyv8O6APtjx9ce4umUx0vxWYM+czzF+8ECMH+yF97wH4PiKuWiPOYDaI7ux/rMJiFj8LR4nR+JewkEm4VbMfrSd2sNekB+0Bpn+y7Fl+sfo1rkrOr3yOmdAFJApkBP4JEEUjPv190ZaejaPT8A1QH+p8GbIjmxF58pnsSFTymMkazJtTaQg3KaDsDkGEMgqyJpqPTIBM70XrxEPMGaMpnIEEUAbo6haSekd1expherV1zvjlVffwOi+nvji7VFY9vlkNCUfx4WgbTjvtxoNp0NwKcAHcet+QuPpEDTHhKI9PhK5IdsRPP9rxK5dgIM/fYPaI4F4dPk0nqbGo/LwLlRF78OTSyfw5PJJbo/OR+FOXDCaogNQesAXxfvXInHdfAxxc0GnTq/w4g1ZvFEz6u2ELt164aPJn/G2FRqLRWYsVmz2CJWGmiZhprK0AbopVhBxxnoA1YKUxWtQdfpJQIoVC/gCvARhTlMNa5dArCdnOogLqRMmTlFurwkg67PpYYUFH76LuB2+uJ2WjKelOahPPonK+GOoSjyFspjDqE04htqkU2i+FIu76efQeu447pyLRnt8BJpjwnArMQoP05NwLzURT/Ou4nlBKp7lXcXjzIu4m5aExqTj6EiKwu0z+1AZvgGlB9biuv9yzPtgLF59Va0XU2lbFvdpkvdGFyusWr3eyIAk3RQwKb0kS6f3kmqyh+gakVg8nZMYwBMz7S303lgRUxMx81KjBVQVlJWFS8ppOWdZnDHKz0ZAVktxMoegxQc//z343auduYDGBHR6Fe959cWFAF/cu34BT8tycC8/HZfDgnB4wxr4LZiDnz6bjO8mTcD3H09EmM9yZBzcg7LjwXh4LR6Pr8XjaVoCHl4+jeozkUg/uAdHt/hi74qFiN62HglBfji3fydObl+P7Mg9uHf+KFpP7kHJAV/kBq5C+ILpcLezYy9Qm7q6qPoQZ0QOOB2TwB4gVsyyosGnJlYvnymPsMQEIcWwfE0G31egf6LEMcC0LUUWYIzJ1//n50pmMugoWQ+RJlkQd0YXocgjKHBfv56HfgMG45VXO6PTK6/hld+9gk0zPsXtK3HoyLiAhyU5qEo4gbMBG3Fg5UIs+XwKVn89DTvmzcAR3yVICliH1ODtKDy0G3fOH8OztAQ8vhqLjqQjyA7ZhnO7NiBsxQJsnj0dcz58H/MmT8Sh9auQsGsLknZvRmVMJGpPHkBZxHbkBPng4uaFmPnuaE2A2llHQZn6N2ToKOTnq4V4Q2r077tI22VZUWbBAqrSfXW9zI4tn8tqGAVq/fsA2ZpoAfvFBXbOgOiXLUZaaqn3SzxQ16j1Y3NuLFqnSKA1gRYsX7lOEdDpVTj07In0sJ24e/0COrJT0JaajLKje5Eb7o8kf19c3OmLnODNuL57DTJ3r0ZR6GaURfqh4lAAWs+E4sGF47h/4ThunglDRWQA8vdvRN7+9bjqvwpJW5Yh2ucnRPksRPahIJSfDENd3CFUnAxBYYQ/soLWISNgBUIXTGcZfPWNbio769IdnTp1wtffLUB9402d10sWozIc9oJc5QXsCSxHei+ovpbuofPceC4gM2DLHMJYD5BShGQ3lqBr2XAlwVbFCdN6gFmGqEooemdsZlUbvQppWbK8GqkpqVwJpUFOffcd3ElLRHtqElqunEXFsX3I2b8R2fs3Ij90C8ojd6A2aidKD2xEZsBypO5YhpzdPijctw61h/xwNyGSc/2m6EBUhG1B4f71yAtcg+xdq1AUsgl10YGoi96D4oM7UB61C5XH96E8ei9yQ7chY7cPMnevwtVtSzDGqx86/a4zl7DJMIZ5uuF8xH7UVVahoLhSp5J6xquDrsiKWd/NkiRWb4BvIkC8QsWAcsvOOANg0y5hAVrSTiP7kWAtvxzRrJKb0ZG3deuydFFJJarKKtB25SzaEqMQsNUPr3exwpYFc/Cn8mw8zruK5oTDyNm7DplB61F80A+Zgb44v2UJzm1bjuu7fZC/xwfZu9YgLWA1UrYuQW7gGrSfCcWtuHCUh21G9u7VSN+1Btk7VyN39yrk7lmLvODNqIgKRM2R3SgN3YTMXauQtccHufs3oCB4A4r3+6Jkrw++Hjca9q79MG3CBOyZNx2Nx/eiYs86FO3dhMLcfAsJL2UzL8QCep8rccFChJkoDt65RQYxVOQz7YqQlNKyO47r+dr6JT6IPMnkTGIAu5x8ubihdtmSyjqUHwnB2S8nI3X9IlyJDMbCpWs5wKYdDMSlyGBErV+GPT/OROBP32Hjd19h9uRJGD/mbbw98k18Pn48ds6ficv+a5AR6IvUnWuQ4b8ct+MP4vGl46gM3YicIF+k+K1Gir8PIpbPxfIvpmL6xAn45L338O2kCVg1/VMEzp+Brd9Ow9bZX2DH/Fnwmz8TK6Z9hAnvjsekjz/H7h+/xe3T+1B7dDdyd6xG3tLZKDufgPzSGkNSRed5d4MGUkgwk6FAtwRfIYFih9xfQ0GYCGi7qZYkjd+AaZC5nq93TSvAX8yAjBkveYHUR2S6ztZSioIi+ilSFcq3r0HGrM+RuPBbxG/4CdMmf4KJ4yfCw9UDX/5+LE5tWIITPguwftpELP90Eg5u24YPfj8BDvauGDnybfit34L9i+fiyLplCFj8A3y/noqknRuQFbEH+xfOwqa5MxG0ZB7Cls3Frp++x4aVa+Dp4QVrawdM/mAiFkyZhAXvjsLuGVNxZu0PCF/2PcaPHoUJo4Zj85xv4OLghHVfT8WN40G4fTkGLUcC0bTbF9VJMcgtrjICrpIgk2VLQNZNjI7J0empAr6Yf5qanVNoBHCeCb9QjtZeYFi57OsxBWUhxkg5jV+FWBafLW5IlcAKlJaUo37fFhQumYOsDUuQtmcdPhw7Fvmno1CWcAJFpw+hOMIfp5bPQtSS75C6byvSd29AVMAOfPr7cdi+YhkuBgci8sdvkB+6DX4/zsHUMaMQvOg7HFzxA76f9B7WzvoShQf9EbdiNo6v+BFXjx3Bt9Om4dPx43F8+0acXjYHOz6biMM/fIWMgOUoDN2MopDNKD2wHtd3rcbwAV5Y/tmHaD8XjWdZF9ByfB+agzehJjkWeSXVL1i3aLr84Fo+oyazYJEnmTPQdQr8QuTkFPF7liC1M+62oe2G/Jh/VS6lBaNCKlu4XwKfJyYW8PPy9QSFVsWiglG59kfkb1uF64E++HbSByiPPYLnRel4UpqNjrRkDsKZ+zYhYd18xK/5HskbFyJx8wokrF2E6IUzkLBpMXLC/LBu/lwcXb0Ajy8cxV+yEpG+cxVWz5qOzNAdSN3lg2MLZ+D4ou9wJWgrUvdvx/U965C0dh4urP8RJSEb0XAiCC1xB9EcG47ywwHI3r8BH4weie9GD0f6xiWc4racCEbzgc0ov5aCvOIqA3wak9pcpQBW1q+Aps8VDhbJYc8wkSGeQffwPIBKEfT7AJEbJS9K2yW3lzhgSUX1Zi1j9V+v/nAnFPBGnkyuWlKNsqspqN20BCUBa5G+Yzmv1+YcOYBnRRl4WHQdT4oz0ZGaiJakaBQf3I4r25ciZfNCnFs7H7ErvkfihoUoObwL53f64ssPP8SlnWvxPDUOv2YmozLSD99OnoQTm1eh7mQwzm9ajLils3Fu5TykblmMnF2rkLfHBxWRO9AaG457F0+g49wx3Eo4hOroPUjb44uPRg9H5OI5SF+/CNUR/mg/HYLG48HIzytCns5cVJJhyXBojGzRdNTSIt7PoJsCrniJIVckQUwAeUDzLZVqmgiQ2SxZOgEvP0GybNTSvxrRWzQk71Vfrr5ErIY7XVyFmthoNEcGoCjAF2unTEDSPj/8UpSOp+V5eFqWi/upiehIjkbT6QMoj/RDcfg2FIVsQWHIZtREB6EtNgxVx4Nxed82NJ46gOfpifg1+yLazoQiN3Q7ak4E4+55uj8ERcEbUbB3A8rCtqPmcAAajgfh5tlIPEqJwdNrcbh36RQ6EqNQfTQQSdtX4Yuxo1ASFYjysO2oPbQLt2IOoPzyOeQVVxu5vFi9ACjA03szGfI5GSIfTUFbXac+r65plB9qdxgrYmL1IjtKihQ5EnBF92Xxha4lkA0t1F8mlsAdp1lxYQlaYsLQELYDoV9MRsBPc/C8MA3PK/LxqDADd6/EqRpP3EE0ndxn5PEtMaG4nXgYN88ewq2UWNzPSMatpCN4lp6I33Iv49bZSG4kHQTsw5QzuBkfgdrDO9FwbC9uxobycx9djcOTtAQ8uhaPB5dPMyHlUTsRsmQOVn85GZWRASgN2oSbsQdRF3NQB1tL5iOAZ2cXGNJjACqga7BV/FPJiEiQ4CLvjRjAtSAtLbLtTsrPCnDLX1Lh7EeXYlXxTW9eNeXG4o7yRdLBnKJKVKSmoDFyBwr3bEDkmkWoSz6Fx9mX8Sg9mWs6d89F425SFBfPOpKP4u7FU7ifEsOS0Z50BHevxqMjJRZ3rsTiybV4/Jx5HrcTDqHh5H7cOxeN++ej8SDlDJ5kJONR6lk8uBLLR2pPM5LxJDUBj6/F4f6lU2g4FYz8sO1YN3MaAqZPRk2EP9riInH7VDDKr15CblGVimE6sTCPxfAAk0WbAZZsR5pSBxVD5JyRBRlB2LTcKI1nuabdbrxCJnME7TESA2irNn1Bdm6h4Q1Gp0UDC8tRGxuFhxePIzPUD2mhO7mS2XH+OO6eP4ZHV2JYJh5fOcPlZSq2EdAPL57AnYRDuJV8FDcvxeBBWhKepyfhl+yLuJt8hK2dliEfnj+Kx1dimBj67JecS/iV22V+/5RIuXwa7QmHUHV0Ny7uXIvVX0xG1m5f3Ew4jLvx4WhJOo5cBstivQSojIWAFuuXkoRovZH1mFJOc7ZkNlDDA2hJkkBUaacuMxspp17l1ymplKql/mOUWE1VP9F+mR3Ll7IXUC6dV4SH+WlojIvEtZAAtF08jdb4CLQmHsG9CycY/MdX47ja+TwjiQtuD84dRfvpfaiO2ombF0/jcVoifsu7gl8LruHxpROoP7ITVQe34k5cKB6nnGYCfsu/yu3X3BT8knUBT67GsjwR2TdOBaMgfAeOr1+K/T/OQOOJPWg7E4aOuHAUpGewoSjAKW1UqSNZsNmqhRQmxDQr5nGKCujZMcVFIUjupUqrUYowQJW/NPWS9audc+qvnIiXvJAJ6V0A1AlxW5kd0yCycwpYO6ldzy1GeU42nmVfRH50KCrPHEJDfASaEqJwOzmaQSICnqSexbP0JPaIB+ePojp8C7J3rcaDjPP4rSybAzBZ9tOrsWg+sQ95u31QEbIRD5Kj8DTtLFv8r7nK8p9lJOHR1VjcOXcMTbHhqDi6B+n7NuHQqh9xfttyJq4jPhzlVy6w9BiWqkFmS8/V0qKt2ywz2dkW2ZVz6j6L5UslVLxF/70gWhO+bVpcEcsmy1f1fJYjWYiRuMC/JNQpqG6GGxp1IUsuTJ3NzMrH9cw8PmbmFKEq4xoKo/ai5NRB1JwJR31cBFrPHUPHxVO4d/Ek7l8+jQcpMXh46SRunT6Awn0bcffqWfyhuhC/5F3Bs+vn8EvOZTy5EoNbMSFopRrOgc1ojt6FhxeO4XlGMnsCBWvyJvKuFgL/SCByQ7fi3I5VOO67EFcD1nCwLzmfgNxCKqqVvgAw918bjxGATTpvvpYNzTThkszJLEeCkVoT1rsiBGSz9MjPkgyPeGGBhsoPsiXPUoJmGRI3NFnBCwRk5iGLBpNfioyUK6hMPo2amHBUnQzBjbOH0ZIQhVsJhzlPp+yFgnJthD9qThzAH8pzcCvpKJpP7kf72UO4nXAY9VG7uYB2PzkKjUcCUX/YHw/OHWHJoYBLEnb/0knW/cqjgcgL24a0oPU4v20ZzvqvQ0ryeeRm5iCvsMKwYAbbpPsW8E3nGFSLVyjPUPeZveMFedJHwsv4WxHqj/aZCGASZJFdlx30UhtP2CQbMv/4wFRypS+gDjDIujNs9ZqA9IwcbvQ+u6AcdakXUX8mHNWnQnEjIQqNZw+h+UwY2mLD0UFbS+Ij0BC9BzVH96A20h+BM6di79wvkbZzDdIDVuPw4llY99lEpO1YhdJ9G9EWE4ZH54/iwYVjvGZAmRUtW9afDEZxpD/ywrbj2m5fXPFbjssRwSgoreXJloBK/c7S/TUsXAiRdQBTEOZxCkEm4A0JM03I1Hn1TOMPNtGfWTQKa/pXkdxkm51pu4l4gniFBGFxK2H55cEQ8BnXc1XTBNDrdPqFemoKGuIOovq0IqAp8QiaYw+iLSYUd+IP4m5CBAfg0r0bkLBkNqLnT8eRRTNwes08JG9agqRNi3Fx/UKcX/o9yoI28pbEhxei8SjlNJNAEy4qPVQdC0Lp4Z3ID9+O9KD1uOK/EimnTiCvqNIAnECkPvNrDTiPI4sAftGyBWweox4nHekcSY08i9/rmbSZUNqsYBAghTf+VaTsetZ/F0G2mkg11OwdlkUGAd8yIaEOysAysxQBYv3p6dl8TMvMR2FaGpoSDqM2Jgz18YfQkBCF5vhItMSE4DZNouKIiHDcjj2ImqN7URgZiMz9m1ERvRcNZ8JRTKtoB7ag5qAfx4r7iRF4cC6KSXhwPhodiYdZ+2uOBaHkkD9nPzkhW3E5YA3SLqbwJJH6RkZiNhixarNHCNh8bVaBYWz8ub7HbICSgioSLCk5SRn9xa9O9JdexQOUdZO86N8Hm35eSUfJ/Y38X8rO5pq3dk9l/ZagS52mQaalZSE1NROp167zMS0jF5npWag7G4X62HDciD+ExqRotCQd5TjQERuKe0mH8eBKHNovnkJt3CGUnwpH5fH9qD0VwscbsQdRcWw/yo/tw42YMNxJisK9pEN4eC4KD5IP8/yBCTi+F2VRu1AS6c8FuPOBm1Q8yik0YpN4KnuoyKQGnM6LnF7Xr80eQSQIwEwcvTd7jBFbFDmWvxuq1z5VyqksX/0+WP/MRte4DS8x/b0EqfCRByjLt8wERYKo8zwAsnhNwNWrGbh27TpvfCIvKD17DPWnVRBuSj6GWxdPcb7eFh+BluRjuHHuJCrPRKL6DKWrh3H34nE0xYRy8a0tLhw3z0agOfEwe1DN6VDUnzmI9uSj7DntsWG8r6j62F5U0hJlpD9Sti/FuYPByCkoYzDZA/SRvVM35QkWgghAOopEmeOcEQtM0iseIZgYRORoDxAJYoC1rKgm8mN6r396Y6x2GX8PR0+2zEzrvN9sUTQgIuDaNQsB7A0Zecg8n4zqY/tQHxfJJLQlR6MtPhKlUbuRc3AnqmMOojEhCtXHglG8dwuKdm1EbeQuVIX5ozBgHUr3bkFN5C4Guo4W6U+GoPRoEG4cC0TLyb2oO7YHFVG7eG34etA6XNyxChkpV5GVU4TrmZqATNVP6iMZhsgSgS2vpYlXC6iSZDBB8pkRA7SnSNME0MZlRUBTuwG2kdfrHWDmXN9Y7dKrQqT95CFi9Qy+iWVzx83yw8DTIDUZdI6uKTwZgZoT+3lO0BB/CHXHg5C+ew2OrfweUctmY99307B3+mQcnPEpomZ9jrgF3yHxx+9x5odZiP7uSwRPn4KIeV8heuVcJG9bgcx9G7gEfePYLlQcDkDpIX/khW7FVb8V2L3oeyRduMZeTaCL9RsSmZbFBmOWTxmHNPVZ/r/EDOO1yUNe9hTCh2fCJEEqBoiFv0iAzGjNpQaqEEouS43TKlOwkhUf1koBX1t/ahpZ/3Vu9J5kKTenAIH7j2LB7EXIDdnCs9Tqk8GojArA1W2LEbV4BvZ+MwVbPn4fYTO+wLGZ0xE1fRpOfPM5Ymd8gZhZX+P0zOk48OVU+H/6IXZ/NRnHls7CpS0LURW5FXVH/FEQulWBv3M1EretxKD+gzHq7Yk4m3CBSeDMTPfxZQkS+RErl3ExAfq1vKejZEMCuBEXTCm5IUEFReXBNxraGHQpKRDIKvjqXb+mLRWWma7l7x4Y4Jt0j16rTisC2KpSM5GRkY1sfQ0N9ty5q1i5xh9v/34mnPqMxc4Vyxj4woM7UBCyBZk7VyDNfxm/rjq6F6XbNqFwxSqU+axD5fqNqNq8AVWbNiNr2XJcXjIfqesWo2T/OpSHrucdcNWRW1Cw3xdZQb5ID1yLOJ/vERfoj6lf/IROr/RC/4FjELQ3jDeNUQJB2R5JRlp61gueYW4vypDK8CxEWUji8WtCGHyNi5DCxTjyAPqlRkGB+rOKBDoTIF5gzG5Nv4WSgptJ+4Vd+SIjsGkPyMzMRV5eIVtVROQpLFqyCV98vQTvTfgW3sM/xphx02HnPAwx8RkoORmOrL3rkBO8Cdd3rUBW4GrUnNiH+phQVBzahexNq5C+bDGyV61E/jof5KxZyecKgtaj6MBGlIasR0X4Bt4HWhzsi4ydK5AVtBZX/FYgYv5nSDkaDZ+NYXitsx1s7AbAxq4fRo+ZhEkff40VKzfynzFTS6vFRrpMY5AU2mztNE7OniSNlXTV5P2UropxiqGyB9A8gP6hQEODyoIM2TH92s+odOrygsgQAW8OwGZm6SgdzskpQEFBMS5eSsN2vxBM/Hg2XDzehEf/cRg26hMMHj4Jo8Z8hhFvfgIH1xHIKriJyguJuB7ki5JDASg8sBFZtM8neCOKwrdx+piyfQni187D0aUzcXTJLJzb+BOTRBuzioM3oOTAOhTtW4OKsPXIC1qNzN0rkb1nDf++IHTuJ8i7lIGtO0/itS726O04AFY2HrCy9kS3nu7o9JotHJy98cX0+YiIPMHGVFxSzpbOcSFDyZJYuXgJg69jgBAgaa2ogui/lGKMGKDSUMvarhxFfkSWeJVHL8CL/AjghvzQ5CO/mAt5ZEGJSSnYsGkv3pswC+79xsHVk8B/G0NHfQyvIR9g8PAPMXrs5xg45AO4eI5Ged1TVKdfR96BjRwPKmlnXPhW3kiVFbgGqTuW4vLmn5C6fSnS/Zbz7wUyd65EQZAPCvb6oHDvGhTtX4vaw9tRf8QPFeGbkBO4Cmd9f+DfG5zxXYCy4lbs3BOL17o4wNquL6x790EPazc+9rTxRPdebuhq5Q5Hl6H4aMos+AWE4HJKOv99bPIMkVWzxQuoFmlSRLAkmWTJUISsPPVXE4UATiu1Fyh5MW2yMsmQ7Pw1z/AIdPIO6mBpaSWuXcvCwcjT+GnJFox7fyb6eL3HwDu7DYed0yB49h+L/oPeYyIGDZuIEW99gr5e78Kj/1jUt/wRNWWNyD2wGdf3rudYUHd8Ly9PlodvZSvPDfJFfpAvCvf4oiR4M6oO7kBN5DZUhG9EXdQONJ8IRHvMXjQd24XikE2I952PqCUzkewzGxdC9qKy7hds2RGNN7o5oaeNB7ce1u5MQC/bPujRyw029v3R29EL1r3pOBgj3/oYCxevx9HoWLbmklKqmhYzqEKG2eINMjItQfrF+JGnYgD9PxPaNGvRfctWbFlQEW94ud5DQYuIoz2fdN3J08lYsToAEz+ei8EjpqCv13voN/BduHiORG8HL1hZe7DeEgGunqPh3m8MvIdNxNCRH8Oz/zt8vrL2KToe/DvO792BggMbkb53A9dvbpw6wHX8Ro4DAcgMWIWsXWuQT1sZD2xGxcFtaDq5F3eTj6IjIRJNJ/ag8pAfzm5chEOLZiBl6yJc2LgAWVdyUVr1HGvWheL1ro5s+VbW7mz5Nnb9YW3Xj99b9+7HxuLkOhTO7sPh4DKEifDoNwYTP56JTVv2sKyWllFFoNSQHLP1izeIHKtYaMmeeFGeCKC9+4bui9xo8BXoagOqBGHJFiora5GdXYQDoccx49tVGDnmcwzwngCvwR+g36Dfc2ddPEfB3nkwD6x7T1celFvfMXDt8yYDPmjoBAwbNZnJcHQbgfziDvz2b8DVhEs4v/FHZAdvQuqe9Sg7GoS606EoivBD6u61uB60HnkHNiM/bBtKIgNQcmgnqo7tQ8PZw2g8E8bxIm7DIoQv/AaXNi9Elt8ixO/aitrGX5CTfwfzF/nhtc726NHLlUnoZesJWwcv9HYcyB5BccHOyRtObsPYgFz7jIKrx0i4eIwwyBg87AP8tMgX8WdVKktLsmz9RmpqSUIkTpBHiCdwEDZLEJEgu5qlxi/aL+9praCyqhYZGfnwCziISVN/gNfgD9Hfezy8Bo/HAO/32eoZfI+R3FkaGA/K2h2OrsPg7DEKbn3eQt+B73IQVh4wFjb23riQUoVf/vg/aL31J0StXYrLWxcjPWgDUnavw7XAdbi+byOu7V6Li34rkRuyleMEtZyQbciPCEDZkT3IPLAFJ9b+iJAF0zlY0+/Czq6Zjesp2ai68RuupjVhyrSF6NzNiY2CSCDp6e04iEEnTyAZsnMcaBBAYyFPcPWkvo/i1+Qdtg7e6DNgLGZ9txRHjp5hnEiGiQRzFqh0X3mJzLJ5JkxZkEpD9V5+vQQpUsSSk0c/wS9HVVUtrl7LxuZtB/DBR9+jv/cE9B34HgdTAb7PgHfYml08RsHRdShbPAU6Ap8G5uw+Ek7uI+DaZzT6eo1jAigQ9/Eah269+iLs0GU8ef5/8fOfgCuJV3Bs8XTe9Xx1tw9Or1+MI6sW4MzGJYjfvAzxm5byqhb9Kj5h+2ok+/kgfutKhC+Zg4MLZzD4mbtWInXrApz234yW2/+GrNx2nLtUjaGjJqN7TzcmgBpZvK3DQCaAGhmMrf0AJsDZfQQToBr1nUgYzc2975t8jjzCve8YTJ02F8EhR1ScKKng7ElSWSMIazmirUCd6H9gkQSphRVLtiMSxBZfWYOUq5nYtPUA3v9wNgYOnYRBQyfCe/iHnL0Q8J4DxrIVm8F3cBnMLm3dWxFAA3NwpR9XD2cPINBJgqhR5zv3cMOaDeF48Pj/4OnP/xvtd/6K41t8kegzG1f8VyE1cC1iNy7G4ZU/IPjHmdg1+3PsmPUZtn3zCfxmfYY9c7/EgQVf4/iK2TjrOx/XdixD/l4fHF82A5lX89F+7x9IzWhC9MlMOLmPYtDFAygGUF97O3rD3nkISyb128F5MFs7jYkAZw/o+6aJgLeYBPIKN89RsHMaAkfX4Rj/4TfYFRjOQFMaS4SIFBEhLxJwo4UlSFZtSOPJC6qr65GalsMW//6HczBw6EcYqIGn4ElWT1ZMckMAkq5TcCWASXrsnbwtBNh4sPw4uAyFoyaA7iXZoube7210t+6LT75chpb2v+Phk3/g5z8COWnFOLbkG6RsW4JLO1bg2m4fXNm5Gue3LsXJFbNxctm3SPCZj3MbfkScz1wkrP8RF7cv53pP7l5fXN74A2J2bsfNu/+O2vqfkXa9Beu3HEbP3gNYdrpZOTMJKugS+IO5jzb2A9DT1pM9mLI3Ap68lsAnwBXoygOkcZxguVLjd3AZjt+P/4rTWPKAomLLugNljkqCCkiC2tgDJP2krIbWOrf5hWE8W/xHGDyc2iQGi6xewCeLJ/DJEiiPJ30ngMkDHF2G8ABooL3ImlyHs3VRsCWyKAbQ8/p7v4c+A8bB2s4Lg4ZPQl7JAzx4/A/8/Ov/xr0n/0RiyAHEr5iByztW4JLfKt5dTWu6hWFbUX90N5pO7EP+vvW4tH0ZUnf7IGOPL7L3reMfY5xaORuFOdW4/+SfyC/swOVrjZgybRF69e5vIsCFXysChnCjeNDLti8bEBkOJRPUiATxAhozewV7A4GvGsuU5wg+R2TaOQ1lIg6EHuFUnaoO5BFMAP1LPYrGlOGQ1VNmExt/GZ98vgj9vSdi0LAPMWTER2zxlLMT8JTD9xv4e0NyqDNk+S4eo1njqcOObsNeIID01d6ZOjOYZYgIoGeo2PF7HowNXeMyAvHnKnDnwT/w6Ol/4Plv/43a2vs4s24hzm9cwJZ/2X81ru7yYY9Ipx9rkEdsWoi0wLXIC9nCs2UigaTrQkQE7jz6L9y682/IyGxBTHwxvIZMgK2D6lc3KxcmgDSfg7Az9Xmwztz6w9ZhgCaAxjdSEeFBQCsJUoSoz8RDFBEjdRsF976jFSauI7BoyXquAJO8058FUvOAumY+QX9EYvGybRg99gsMHTkF3sM+xOARk1hyvIZYMhzPAe/wJIrBF9lxp4xHS4yWGpEhCmZkVTQwMwH0HPICauQ5pL9WNv2xa18iOu7/J+4/+nc8//W/8PiX/0HWhVTErZmDpA0/IWnzYqQErELypkWIWTkbib7zkLF7NQrCVMUzg3Y8bFqI+K2rUF1zH49//idqbzzHtfQm+AXGwsbBG/YuQ1nnSf9JgshDyVikj+wJJKEOXioIe1LmMwLOlA15jGSZVUCLB5AEWY5CAIEvsYM8g7KmIcMn4NTpRDQ0tqo0lP5qBwXa/SEnMHTUNLZIyhJY6wl8nV6S5RNo7HocfN5S7LPuj2BgycppcEoDh8DOcZB2Y5IfCsreTJBrn7fYg9j6+41hyyPSulp54KelgWjr+A903Ps7nv/yn/j5t3+i48E/cOVwBM6u+Q5xvgtwbusyXiug8kTevnUoObgdheHbeLH9wralnAEVpRfg2R+AB4//AyVl93ElrQmzf9gKK5t+cHDW6bGtJ6ecFKfIA8RQ7J0Gw4nHM1hLCgGovFsyIzIakSbCg8lgz1DxQeIGNbqX7nNyG4qetgMw67slaGpqU0GYZsJlZVX4acl2jHn3Gwzwfo/BJQ8ggMhCaWJF5QLP/m+bvky5I6WVBDB1jgigwRGYDLiDl/II12GGxpKnkFQRmUQCxQYihkjo3ssTk6ctRn3zX9B+5294/Owf+MMf/w9+/sN/o6ziPlL2++HMipk4uWouLvmtRPa+9SgI2cwli7Q965G4eQliVn6L6zGnkZjShNSsFty681fkFtzCpas38M7736Bn7/4McG+HgXqO4qmyIJZJigFKgsjSJQsiUNUEbBCPlQyOYp2a05DVa8s3PEBLk8QFT/0sjo/D8NbYybwhmmMA/cfPtPRcTP18Md55fyaGvzkVTu7DTXqvZMKcZrIrck6v8npqDpR6stYR4MoLVGqnApnIE2uqxyiu/dD9BD5pMh0JnOFvfYqC0odo7/g7Hj/7Tzx4/L8Ql1yBE2crUFJ0E9ciQxC95BtEUwa0cREu71jJZCRuWoIzPnORcfoUMnJvIexoDlZvOo3T8QXIL7yNU3GFPA4CkRqBT0ZBwFMWJPMA6jclETb2KhWlcRIJJKV0H4EvY+bYYArOAjgRQZ+J9ZPHEA7iCfS8i5fTlQe0tLTjSPRZtv633vmSi2PEKnWCCKDJFYPPqSbp/QjdKXqY6ggHX82uuKnyjKFqut/LlUkxd5yyIQLdxn4gt95Og1kjXfuMwbnLtbj74B/ouPc3RERnY39EBlJSG5CZ24665j8h71IaTq7+HidXfY+ztDdoy1LErPkeWXHxyC99yNeeii9FyKF07Am5jKycm9gbkgxbR9J4FZdE85U0DmK5JO+l81bWNDfwUFLjPpLJIZLIQ3gMbjQ5U/KrgrBSAwsZWo44O6TMcBgHdCKHPIE8PSQ0WgXhW7fucso5/M1pGPnWpxg2mgpp4/gLWSo0+KRrzKAEIy09FJCoyWuSGIoD9NrFfThnQ+Ti3Xo4cDGOgFeSpGKCWD8RQBOZXnYDERqZgifP/wcpqfXwC0xA0sVaXE1V/+KqpeURapr/yiTErp2HxM1LEb9uAa4cDEZRxWOkZbbiWnojki9WIuVqHU7GlSDteitW+Yaw/pPF29h7MeAkRWz1Wja5NN3LRVmr1n0CvVfvfjyTV/IpBEgQVtZOWHE80ImJkEKvpcxBmBD5nbs7Y/nKLSoI089UF6/ww7DRn3DKOWTEJPQb9B7snZWlsObzlyjpMWRHA0/WbrF8pY1KilQlkYIZsU4Dp4BHz1RBWTIjmv6r7IOI6NrTA2vWh+Peo3/iRGwRIqMzkZndjNT0BmTl1KCouB5ZebdRUfszLgbvRozPPJxYMw956aXIKryP69ltPOHKzW1FYfFdnIwtwrlLtZg+cxWsbPqyNSu9V99N30myQ2Mh6ycyZGx0ngxRzZQHqbHTZ9oIlRyT5WsCNOCGQmicKOPimOIylDOurj1cedGHCaCFga+/XY0Rb37GuT7Ljtc4ZrJX7z6GZquAS5mAlhrupPoCIYCBZ0IoG1JaSgsboqt0L3uIKS0VL2BgHL3RracHvpyxCnWNf8LFK/W4cLkG17OaUFFxD2kZTcjKvY2svHbklz1Batx5RC36Gqe2b0BB8V3kFd1Fdf2vKCyiv4V6H+VVTxj82MRyjB47TRPgpQMt9cGbvYClxTQeIzZwedqT1wXIqyXuMcA6JVWvCfg3FRk6MRFplnhDRkyvVWXAE+9P+Er9L8nikhp8NHUBho6czEHKo5/KdIgAsgialqsvU2xb5Ea8gEq0BLKeA+gALE2m92z1lB1xhqQI4OyHtX8QbO2pHOyNnrb98Na4LxCbWIH0zFbkFnQgM7sVZeV3UVf3GGVVT5BffB85ZO1XSxC17FvEBvqjuuGPaGr7C6rrnqGsrAMVVY9RXfsU2bntOHYqhzWbrE9NCnW2Y5r9qv5axkEEkOWT/HD2o2WHrV5b978QoskwlMBlKJdhJG4QljQB7GnbB6Pe+oh+oFEZnJFZhHfen8H5Plm+UVDTANPFZNnm7EfpP1m6Rf/NGZBYlx0Xt9SglMXLYNU1nA6+5AGkz329xiLy6HVkZLWipu4Z8go7UFR8CzcanqOl/d/Q0PInFFc8Rl7JE8Ts3YeIZXNwo/4hWm//HQWF9Fcg7zIRFZUPUFn1GLv2xKCHdV9OiwlY0WQxDiFBeYPyCMniqF90jYArMkz4sBrQ+DXglvg4kvEgD6K1BhfPN9HbYZCR8hIJQ0Z8QH+qoDr44qVMXkyhAhkFW0O/3BTDZDXEnLJ43XQAZmvhDigChAQmgMDXFiWzS7F4sxcodycPUIMlcIiEyKgUzl4aGp6htOIhysrvoazsLprb/oybHX9D662/orb5L8hMr8ah9atRVnYHFTXPUFDQxnOGxqZfUFh0C9XVjzF3/iZedCfwqc6vgCWPk9mvMgLqM1VxlefqyaSTmjxy8NWWL9bN5GnvVlavr3Ebwc/t3tPZmDv0tO3LMZBknYzay3scOlVW1gbHnb3CBNCNnL24jzAAkvy1Ry93tmRD8826TyUI47WybtJ7uk/ApqN0WLTfsDqdBhLorM9OFAfc4RdwhAtoVdX3mYTKqocoL7+D+hvPmADyhJsdf0VV/S/IzmlGWfXPyC9oR3HxLdTUPEJz03Pk5LYiv+AW3n73CwaA+6QJoCxIBWGVDamgrK2f4xXJEM0VKPe3yK6Ar8arxqRIEeNU1k/SRQTQeRobgU8zb153tnaHZ/830am6ujb42IlkDBk5lTWf8nH5ArJW6hR9kVqoHqByeEPjVGfE4sVixIVJ06miKEHX3CjTMAdCCVRqcjSIs4R5CzZyFlNY1I62tl9QW/cYdbWPOLjSLLmp7c9obP0z6pv/hOobf0RhyX2UV9xDRcVdJqy+/jGyctqQeK6EsxSeSHEGpFJQFYAtMiQeLJJJr2nMND7D6jXoxjVc/xIjJAlS0kREduvhyGk3naegS6AT+FL8o7J1p9ra+uBDUfG8yEIBmErCRILIBTVintzGWFLUAUXJlCo9M4g6nZSpPIFKC/EiQ8rCZPJj0VshgD4TWehhTVnCN8jNa+cUtLX1Z9y48ZRbZdUDVNf/gvaOv6H6xm+orPsVxeWPUFr5BNU1D1FV/QAtLT8zETl5txC0Pw49rPsYdSkhmaSG5wK6v2YiaMxyrcpoFLBqHC8ZkyaCPYRUxHkoetr0Qdfu9tqQaTzujIWUvykToroQExAafpoJoHoPT4RsaVqugiKVZNUXeTOjZD2SB6s4oGRHZTRqii/Bl+4nxmn3mUUzleUL6HI9B2J7L7VTzV61PgPG4PylSqRmNKKx4QmamhQBN248QVnlY9Q1/pFbUek9lFQ8RkPLn1Fb94QtnwgrKLyJnLzbWLBoO7r0UGu8bPkG6NRPCwHcb5NUUt9FapSnU3pKpFkyJ2nyOTXCrkt3e7Zyup/AJgK69nBCV/YKlQk5ug4hAhqCA/ce4b07VPuhKE8ewNs07L2YAAKDHkQzRCopqAmW5P9i3SIlapAsKaTp9mo7Cn0mAxPvMOuwIlDNUNlCKV+264+Iw5d4GbG29iGam56hsVGR0ND0K+qa/oSK6geor2tGc8tztNz6G5pbfkVT41O0tDxHVk4zUjOa8f6Hs9ijuC7FQV5nQcZ3KxkywHQdxnLF8vNCrBtqzJylz8oDLBNQek/Yde5qq/Dg7TgEviM6d+3NwZeeSyVw2oHXqb6+Kdh/10G49nmbCaDJBFkjBRA1AaGCFNVABsPWvj86d+vNoLIu6s5Z3NLSOQGYBsLxg6bxxrXK9UkGRIMNbxBiKA5YucF3Qwgysm6ynDQ3PUVj4xM03HhiEFBadhutTe1ov/0HtN/5O1rbflMEND/D9axmnI7N510LKrtSkiJFNfpuS8yiWGfxUEof1RjNsiPzBl070msb1GQ+ROc7d7PlWhJ9TmQQ+G90tYGVtRsrDJdlrJzh4OKtPMB/ZzicPWiN9l2eRiv9o50BapeYYo1KuN7o0t1Oe4HunPYAs7Swzps0nSK/uCODTq6vvYWavb6OLIMnY7oq2dXKFdNnLEdqBmUyN1mCyBMqK+6ipv45KmpUu9H0M27d/Rtu3/07mlt+QWPDY5Ys8pwdu07y8qMsrqhArGIAg2myfiqXcObjqDMf9nI9q3dW/eUYRRM5lipVVjen5TTOzl1tWKbI6Lr1dOH3pPuq2DiQX3fp4QQX92GUBdUH7w46BFvHoVz1lAkYBU6SA4redAPN5qgDPW3cmU16zaAbM15FgliwcnfVWVl5kvoLDUYt2GuitPXT9xHRQgIRP/LNj5FwroKtmeSHyhFFRe0oKrmLsqpnuNHyJ05JafGGCGhs+hk36h+jru4Rr/9+N3cDlza4rqWzLEW6SXo0EfKepE9ZtCXBYEnindRKkjlDNMrr6lq2/q42aqyOgxg3kh2ydlVvouBMHkGxwAn9B76NTjU19VFHjiXBxmEobw905xo9kUCFIwoo5AnkMrRwrVaNunTrzbqm9FJmgar0rCxJEWLWSpIxul9dZ9JU06xYTdLU9aqp6uGhY1koLHmEx4/+A7dv/xWtrX9EQ9Ofcefhf+PZr8AvfwR++7Nqjx7/Fx4+/F9ob/8LLl1rxbjxM9kDVJnZUveR1FH6ogItpY/KMMiyWdNlNqxjk0rN1f3O7pSOq+s41bR2R5dutnw/GS4F4m5WTrClTFKX3kn7u/ZwRreebnhr7BT8PxVRzLRYsX2iAAAAAElFTkSuQmCC',
      1: 'data:image/png;base64,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',
      2: 'data:image/png;base64,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',
      3: 'data:image/png;base64,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',
      4: 'data:image/png;base64,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',
      5: 'data:image/png;base64,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'
    }

    // ══════════════════════════ part 2: 液体玻璃浮层 + 变阻器条 ══════════════════════════

    var STYLE_TEXT = [
      '.am-overlay-host{position:fixed;inset:0;pointer-events:none;z-index:2147483000;',
      '--am-blue:#4d6bfe;--am-blue-2:#22d3ee;',
      '--am-bg:rgba(255,255,255,0.72);--am-bg-solid:rgba(255,255,255,0.92);',
      '--am-card:rgba(255,255,255,0.55);--am-border:rgba(15,23,42,0.10);--am-border-strong:rgba(15,23,42,0.18);',
      '--am-text:#1f2329;--am-muted:#667085;--am-faint:#98a2b3;--am-track:rgba(15,23,42,0.10);',
      '--am-shadow:0 18px 50px rgba(15,23,42,0.16),0 2px 8px rgba(15,23,42,0.08);',
      'font-family:-apple-system,"Segoe UI","PingFang SC","Microsoft YaHei",system-ui,sans-serif}',
      'body[data-ds-dark-theme] .am-overlay-host{--am-bg:rgba(24,24,27,0.74);--am-bg-solid:rgba(28,28,31,0.92);',
      '--am-card:rgba(148,148,155,0.08);--am-border:rgba(148,148,155,0.14);--am-border-strong:rgba(148,148,155,0.26);',
      '--am-text:#ececee;--am-muted:#9a9aa2;--am-faint:#6b6b72;--am-track:rgba(148,148,155,0.16);',
      '--am-shadow:0 18px 50px rgba(0,0,0,0.5),0 2px 8px rgba(0,0,0,0.3)}',
      '.am-overlay-host *{box-sizing:border-box}',
      '.am-mono{font-family:"JetBrains Mono","Cascadia Code",Consolas,monospace;font-variant-numeric:tabular-nums}',
      // ── 变阻器条 ──
      '.am-bar{position:fixed;display:flex;align-items:center;gap:10px;height:38px;padding:0 12px;width:320px;max-width:calc(100vw - 28px);min-width:0;border-radius:12px;',
      'background:var(--am-bg);border:1px solid var(--am-border-strong);box-shadow:var(--am-shadow);',
      'backdrop-filter:blur(18px) saturate(150%);-webkit-backdrop-filter:blur(18px) saturate(150%);',
      'cursor:grab;user-select:none;pointer-events:auto;transition:box-shadow .2s ease,transform .2s ease}',
      '.am-bar:hover{transform:translateY(-1px);box-shadow:0 14px 40px rgba(15,23,42,0.16)}',
      '.am-bar:active{cursor:grabbing}',
      '.am-bar-ico{display:flex;color:var(--am-blue);flex:none}',
      '.am-bar-ico svg{width:13px;height:13px}',
      '.am-bar-dot{width:8px;height:8px;border-radius:50%;flex:none}',
      '.am-band-spec{background:#16a34a;box-shadow:0 0 8px rgba(22,163,74,0.8)}',
      '.am-band-mixed{background:#d97706;box-shadow:0 0 8px rgba(217,119,6,0.8)}',
      '.am-band-react{background:#dc2626;box-shadow:0 0 8px rgba(220,38,38,0.8)}',
      '.am-band-unknown{background:#9ca3af}',
      '.am-bar-track{position:relative;flex:1 1 auto;min-width:96px;max-width:150px;height:7px;border-radius:99px;background:var(--am-track)}',
      '.am-bar-fill{position:absolute;left:0;top:0;bottom:0;width:0;border-radius:99px;',
      'background:linear-gradient(90deg,var(--am-blue),var(--am-blue-2));transition:width .5s cubic-bezier(.4,0,.2,1),background .3s ease}',
      '.am-bar-fill.am-fill-spec{background:linear-gradient(90deg,#4d6bfe,#16a34a)}',
      '.am-bar-fill.am-fill-mixed{background:linear-gradient(90deg,#4d6bfe,#d97706)}',
      '.am-bar-fill.am-fill-react{background:linear-gradient(90deg,#4d6bfe,#dc2626)}',
      '.am-bar-fill.am-fill-unknown{background:var(--am-faint)}',
      '.am-bar-tick{position:absolute;top:-2px;bottom:-2px;width:1px;background:var(--am-border-strong)}',
      '.am-bar-knob{position:absolute;top:50%;left:0;width:13px;height:13px;border-radius:50%;transform:translate(-50%,-50%);',
      'background:#fff;border:2px solid var(--am-blue);box-shadow:0 1px 6px rgba(15,23,42,0.35);transition:left .5s cubic-bezier(.4,0,.2,1)}',
      'body[data-ds-dark-theme] .am-bar-knob{background:#1c1c1f}',
      '.am-bar-score{font-size:12.5px;font-weight:700;color:var(--am-text);min-width:40px;text-align:right}',
      '.am-bar-phase{font-size:10.5px;padding:2px 8px;border-radius:7px;border:1px solid var(--am-border-strong);color:var(--am-muted);flex:none}',
      '.am-phase-healthy{color:#16a34a;border-color:rgba(22,163,74,0.45)}',
      '.am-phase-warning{color:#d97706;border-color:rgba(217,119,6,0.45)}',
      '.am-phase-critical{color:#dc2626;border-color:rgba(220,38,38,0.45)}',
      '.am-phase-restart{color:#7c3aed;border-color:rgba(124,58,237,0.45)}',
      '.am-phase-offline{color:var(--am-faint)}',
      '.am-bar-ticker{flex:1 1 auto;min-width:0;max-width:150px;font-size:11px;color:var(--am-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;',
      '-webkit-mask-image:linear-gradient(90deg,#000 72%,transparent);mask-image:linear-gradient(90deg,#000 72%,transparent)}',
      // ── 面板 ──
      '.am-panel{position:fixed;display:flex;flex-direction:column;border-radius:20px;background:var(--am-bg);',
      'border:1px solid var(--am-border-strong);box-shadow:var(--am-shadow);',
      'backdrop-filter:blur(24px) saturate(160%);-webkit-backdrop-filter:blur(24px) saturate(160%);',
      'overflow:hidden;pointer-events:auto;animation:am-panel-in .18s cubic-bezier(.2,.8,.2,1)}',
      '@keyframes am-panel-in{from{opacity:0;transform:scale(.965) translateY(6px)}to{opacity:1;transform:none}}',
      '.am-panel-header{display:flex;flex-direction:column;gap:6px;padding:10px 13px 8px;border-bottom:1px solid var(--am-border);',
      'cursor:grab;user-select:none;background:linear-gradient(180deg,rgba(77,107,254,0.07),transparent)}',
      '.am-panel-header:active{cursor:grabbing}',
      '.am-panel-top{display:flex;align-items:center;gap:8px;min-width:0}',
      '.am-panel-title{display:flex;align-items:center;gap:7px;font-size:13.5px;font-weight:650;color:var(--am-text);flex:1;min-width:0}',
      '.am-panel-title svg{color:var(--am-blue);flex:none}',
      '.am-title-text{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.am-panel-sub{display:flex;align-items:center;gap:8px;min-width:0;overflow:hidden}',
      '.am-ssel-label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:120px}',
      '.am-ssel-idle{border-color:var(--am-border-strong,rgba(128,128,128,.35))}',
      '.am-ssel-follow{border-color:rgba(77,107,254,.75);box-shadow:0 0 0 2px rgba(77,107,254,.18);color:var(--am-blue,#4d6bfe)}',
      '.am-ssel-manual{border-color:rgba(217,119,6,.5)}',
      '.am-ssel-untracked{border-color:rgba(220,38,38,.5);color:#dc2626}',
      '.am-ssel-follow .am-ssel-caret{color:var(--am-blue,#4d6bfe)}',
      '.am-sub-note{flex:1;min-width:0;font-size:10.5px;color:var(--am-faint);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.am-chip{font-size:11px;padding:3px 10px;border-radius:999px;border:1px solid var(--am-border-strong);color:var(--am-muted);flex:none;white-space:nowrap}',
      '.am-chip-cur{color:var(--am-blue,#4d6bfe);border-color:rgba(77,107,254,0.6);background:rgba(77,107,254,0.08)}',
      '.am-chip-band.am-cb-spec{color:#16a34a;border-color:rgba(22,163,74,0.5);background:rgba(22,163,74,0.08)}',
      '.am-chip-band.am-cb-mixed{color:#d97706;border-color:rgba(217,119,6,0.5);background:rgba(217,119,6,0.08)}',
      '.am-chip-band.am-cb-react{color:#dc2626;border-color:rgba(220,38,38,0.5);background:rgba(220,38,38,0.08)}',
      '.am-status-ok{color:#16a34a;border-color:rgba(22,163,74,0.45)}',
      '.am-status-off{color:#dc2626;border-color:rgba(220,38,38,0.45)}',
      '.am-panel-actions{margin-left:auto;display:flex;gap:6px;flex:none}',
      '.am-btn{display:inline-flex;align-items:center;gap:5px;font-size:12px;padding:5px 10px;border-radius:9px;',
      'border:1px solid var(--am-border);background:transparent;color:var(--am-muted);cursor:pointer;transition:all .15s ease}',
      '.am-btn:hover{background:rgba(77,107,254,0.12);border-color:rgba(77,107,254,0.5)}',
      '.am-btn-ico{width:26px;padding:5px 0;justify-content:center}',
      '.am-select{font-size:11px;padding:4px 8px;border-radius:8px;border:1px solid var(--am-border-strong);background:var(--am-card);color:var(--am-text);max-width:130px}',
      '.am-ssel{display:inline-flex;align-items:center;gap:6px;font-size:11px;padding:3px 12px;border-radius:999px;',
      'border:1px solid var(--am-border-strong,rgba(128,128,128,.35));background:transparent;color:var(--am-text,#111827);cursor:pointer;flex:none;white-space:nowrap;transition:border-color .15s ease}',
      '.am-ssel:hover{border-color:rgba(77,107,254,.55);color:var(--am-blue,#4d6bfe)}',
      '.am-ssel-caret{opacity:.6;font-size:9px;margin-left:2px}',
      '.am-chip-warn{color:#dc2626;border-color:rgba(220,38,38,.45)}',
      '.am-chip-manual{color:#d97706;border-color:rgba(217,119,6,.45)}',
      '.am-ssel-pop{position:fixed;z-index:2147483001;min-width:190px;max-width:280px;max-height:min(320px,60vh);overflow-y:auto;',
      'padding:6px;border-radius:12px;border:1px solid rgba(128,128,128,.28);',
      'background:rgba(255,255,255,0.82);backdrop-filter:blur(14px) saturate(1.35);-webkit-backdrop-filter:blur(14px) saturate(1.35);',
      'box-shadow:0 10px 30px rgba(0,0,0,.22);color:#111827;font-family:inherit}',
      '.am-ssel-item{display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;padding:7px 10px;',
      'border:0;border-radius:8px;background:transparent;color:inherit;cursor:pointer;font:inherit;font-size:11.5px;text-align:left}',
      '.am-ssel-item:hover{background:rgba(77,107,254,.10)}',
      '.am-ssel-item.am-ssel-cur{color:#4d6bfe;font-weight:600}',
      '.am-ssel-meta{color:#6b7280;font-size:10px;opacity:.85}',
      '.am-ssel-empty{padding:8px 10px;font-size:11px;color:#6b7280}',
      'body[data-ds-dark-theme] .am-ssel{color:#ececee;border-color:rgba(148,148,155,.3)}',
      'body[data-ds-dark-theme] .am-ssel:hover{border-color:rgba(124,140,255,.6);color:#8f9bff}',
      'body[data-ds-dark-theme] .am-ssel-follow{border-color:rgba(124,140,255,.8);box-shadow:0 0 0 2px rgba(124,140,255,.22);color:#8f9bff}',
      'body[data-ds-dark-theme] .am-ssel-untracked{color:#f87171;border-color:rgba(248,113,113,.5)}',
      'body[data-ds-dark-theme] .am-ssel-pop{background:rgba(20,22,28,0.86);border-color:rgba(148,148,155,.26);color:#ececee;box-shadow:0 10px 30px rgba(0,0,0,.5)}',
      'body[data-ds-dark-theme] .am-ssel-item:hover{background:rgba(77,107,254,.18)}',
      'body[data-ds-dark-theme] .am-ssel-item.am-ssel-cur{color:#8f9bff}',
      'body[data-ds-dark-theme] .am-ssel-meta{color:#9a9aa2}',
      'body[data-ds-dark-theme] .am-ssel-empty{color:#9a9aa2}',
      '.am-offline{margin:8px 13px 0;padding:7px 10px;border-radius:10px;font-size:11.5px;color:#dc2626;',
      'background:rgba(220,38,38,0.08);border:1px solid rgba(220,38,38,0.3)}',
      '.am-kpis{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;padding:12px 14px 6px}',
      '.am-kpi{background:var(--am-card);border:1px solid var(--am-border);border-radius:12px;padding:8px 10px;min-width:0}',
      '.am-kpi-label{font-size:10px;letter-spacing:.6px;text-transform:uppercase;color:var(--am-faint);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.am-kpi-value{font-size:16px;font-weight:700;color:var(--am-text);margin-top:2px;white-space:nowrap;overflow:hidden}',
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
      '.am-event.k-iv{color:#dc2626}.am-event.k-th{color:#d97706}.am-event.k-guard{color:#d97706;font-weight:600}',
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
      '.am-iv-switch{min-width:64px;justify-content:center;font-weight:600}',
      '.am-iv-on{color:#16a34a;border-color:rgba(22,163,74,0.5);background:rgba(22,163,74,0.08)}',
      '.am-iv-off{color:var(--am-muted)}',
      '.am-welcome{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;z-index:2147483050;pointer-events:auto;background:rgba(15,18,30,0.28);backdrop-filter:blur(3px)}',
      '.am-welcome-card{width:min(440px,calc(100vw - 48px));background:var(--am-bg-solid);border:1px solid var(--am-border-strong);border-radius:18px;box-shadow:var(--am-shadow);backdrop-filter:blur(22px) saturate(160%);-webkit-backdrop-filter:blur(22px) saturate(160%);padding:22px 24px;display:flex;flex-direction:column;gap:12px;animation:am-panel-in .2s cubic-bezier(.2,.8,.2,1)}',
      '.am-welcome-title{display:flex;align-items:center;gap:8px;font-size:16px;font-weight:700;color:var(--am-text)}',
      '.am-welcome-sub{font-size:12.5px;line-height:1.7;color:var(--am-muted)}',
      '.am-welcome-steps{display:flex;flex-direction:column;gap:8px;font-size:12.5px;color:var(--am-text);line-height:1.6}',
      '.am-welcome-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:4px}',
      '.am-btn-primary{background:linear-gradient(135deg,#4d6bfe,#3b5bdb);color:#fff;border:none;font-weight:650;padding:8px 20px}',
      '.am-btn-primary:hover{background:linear-gradient(135deg,#5a76ff,#4464e8)}',
      '.am-update-banner{position:fixed;top:14px;right:14px;z-index:2147483040;display:flex;align-items:center;gap:10px;max-width:min(360px,calc(100vw - 28px));padding:10px 12px;border-radius:12px;background:var(--am-bg-solid);border:1px solid rgba(77,107,254,0.45);box-shadow:var(--am-shadow);backdrop-filter:blur(18px);font-size:12px;color:var(--am-text);pointer-events:auto;animation:am-toast-in .2s ease}',
      '.am-update-banner .am-badge-dot{width:8px;height:8px;border-radius:50%;background:#4d6bfe;box-shadow:0 0 8px rgba(77,107,254,0.8);flex:none}',
      '.am-update-banner b{font-weight:650}',
      '.am-resize::after{content:"";position:absolute;right:5px;bottom:5px;width:8px;height:8px;',
      'border-right:2px solid var(--am-border-strong);border-bottom:2px solid var(--am-border-strong)}',
      // ── 侧边栏入口 ──
      '.am-side-entry{display:flex;align-items:center;gap:7px;width:100%;cursor:pointer;user-select:none}',
      '.am-side-ico{display:flex;flex:none;opacity:.9}',
      '.am-side-label{flex:1;text-align:left;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.am-dot{width:7px;height:7px;border-radius:50%;flex:none}',
      // ── 梗皮肤(meme「滑动变祖器」) ──
      '.am-bar.am-bar-meme{width:352px;max-width:calc(100vw - 28px)}',
      '.am-bar-meme .am-bar-track{position:relative;min-width:84px;max-width:120px}',
      '.am-bar-meme .am-bar-ticker{max-width:96px}',
      // 气泡是 .am-bar 的直接子元素(position:fixed 为其包含块): bottom:100% = 完全浮在条上方,
      // translateX(-50%) 让 left 指向 knob 中心(0.2.5 曾漏写导致整体右偏 17px 错位)。
      '.am-bar-bubble{position:absolute;bottom:100%;width:52px;height:52px;padding:4px;border-radius:14px;',
      'background:var(--am-bg-solid);border:1px solid var(--am-border-strong);box-shadow:var(--am-shadow);',
      'display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:2;',
      'transform:translateX(-50%);transition:left .5s cubic-bezier(.4,0,.2,1)}',
      '.am-bar-bubble::after{content:"";position:absolute;top:100%;left:50%;transform:translateX(-50%);',
      'border:7px solid transparent;border-top-color:var(--am-border-strong)}',
      '.am-bar-bubble img{width:100%;height:100%;border-radius:7px;object-fit:cover;display:block}',
      '.am-bar-bubble img.f-spec{animation:am-face-spec 1.6s ease-in-out infinite;box-shadow:0 0 10px rgba(22,163,74,0.7)}',
      '.am-bar-bubble img.f-mixed{animation:am-face-mixed .9s ease-in-out infinite;box-shadow:0 0 10px rgba(217,119,6,0.75)}',
      '.am-bar-bubble img.f-react{animation:am-face-react .5s ease-in-out infinite;box-shadow:0 0 13px rgba(220,38,38,0.9)}',
      '.am-bar-bubble img.f-unknown{opacity:.5;filter:grayscale(.65)}',
      '@keyframes am-face-spec{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}',
      '@keyframes am-face-mixed{0%,100%{transform:scale(1)}50%{transform:scale(1.1) rotate(-2deg)}}',
      '@keyframes am-face-react{0%,100%{transform:scale(1)}25%{transform:scale(1.14) rotate(-3deg)}75%{transform:scale(1.08) rotate(2deg)}}',
      '.am-meme-chip{font-size:11px;font-weight:700;padding:2px 8px;border-radius:7px;flex:none;white-space:nowrap;color:var(--am-text);border:1px solid var(--am-border-strong);background:var(--am-card)}',
      // ── 面板干预提示行 ──
      '.am-iv-hint{margin:8px 13px 0;padding:6px 10px;border-radius:9px;font-size:11px;line-height:1.55;',
      'color:var(--am-muted);background:rgba(77,107,254,0.07);border:1px solid rgba(77,107,254,0.22)}',
      '.am-iv-hint .am-hint-ico{color:var(--am-blue);font-weight:700;margin-right:5px}',
      '.am-iv-hint.off{background:rgba(148,148,155,0.06);border-color:var(--am-border)}'
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
      }, 1500)
      resizeHandler = function () { redrawAll() }
      window.addEventListener('resize', resizeHandler)
    }
    function unmountOverlay() {
      if (unsubscribeAll) { unsubscribeAll(); unsubscribeAll = null }
      if (tickerTimer) { clearInterval(tickerTimer); tickerTimer = null }
      if (resizeHandler) { window.removeEventListener('resize', resizeHandler); resizeHandler = null }
      removeBar()
      removePanel()
      if (typeof removeWelcome === 'function') removeWelcome()
      if (typeof removeUpdateBanner === 'function') removeUpdateBanner()
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
      if (typeof syncOverlayLayers === 'function') syncOverlayLayers()
    }

    function isDark() {
      return document.body && document.body.getAttribute('data-ds-dark-theme') !== null
    }

    // ── 变阻器条 ──
    function barHtml() {
      if (state.skin === 'meme') {
        return '<div class="am-bar-bubble" data-am="bubble"><img class="am-bar-face" data-am="face" alt="' + esc(TEXTS.memeTitle) + '"></div>'
          + '<div class="am-bar-ico">' + ICON_RADAR + '</div>'
          + '<i class="am-bar-dot am-band-unknown" data-am="dot"></i>'
          + '<div class="am-bar-track">'
          + '<div class="am-bar-fill" data-am="fill"></div>'
          + '<span class="am-bar-tick" style="left:' + (state.thresholds.specMax * 100).toFixed(0) + '%"></span>'
          + '<span class="am-bar-tick" style="left:' + (state.thresholds.reactMin * 100).toFixed(0) + '%"></span>'
          + '<i class="am-bar-knob" data-am="knob"></i>'
          + '</div>'
          + '<span class="am-bar-score am-mono" data-am="score">—</span>'
          + '<span class="am-meme-chip" data-am="title">' + esc(TEXTS.memeTitle) + '</span>'
          + '<span class="am-bar-ticker" data-am="ticker"></span>'
      }
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
      barEl.className = 'am-bar' + (state.skin === 'meme' ? ' am-bar-meme' : '')
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
      var face = barEl.querySelector('[data-am=face]')
      barEl.className = 'am-bar' + (state.skin === 'meme' ? ' am-bar-meme' : '')
      fill.style.width = pct + '%'
      fill.className = 'am-bar-fill am-fill-' + band
      knob.style.left = pct + '%'
      if (dot) dot.className = 'am-bar-dot am-band-' + band
      if (face) {
        face.src = liangUrl(score)
        face.className = 'am-bar-face f-' + band
        face.title = TEXTS.memeTitle + ' · ' + (score == null ? '—' : score.toFixed(1)) + ' · ' + band
      }
      // 表情气泡: 锚在强度圆圈(knob)上方, 随强度左右滑动。
      // 气泡是 .am-bar 的子元素: left 用「轨道偏移 + 强度比例×轨道宽」换算成条内坐标,
      // 再 translateX(-50%) 中心对齐 knob(0.2.5 曾直接相对轨道定位且漏写居中, 造成右偏+压条)。
      var bubble = barEl.querySelector('[data-am=bubble]')
      if (bubble) {
        var trackEl = barEl.querySelector('.am-bar-track')
        var tw = trackEl ? trackEl.offsetWidth : 100
        var tLeft = trackEl ? trackEl.offsetLeft : 12
        var barW = barEl.offsetWidth || 320
        var knobX = tLeft + pct / 100 * tw
        // 气泡 52px → 半宽 26px, 钳制保证气泡不超出条边界
        knobX = Math.max(26, Math.min(barW - 26, knobX))
        bubble.style.left = knobX + 'px'
      }
      scoreEl.textContent = score == null ? '—' : score.toFixed(1)
      if (!state.monitorOnline) {
        scoreEl.textContent = '—'
        if (phaseEl) { phaseEl.textContent = 'offline'; phaseEl.className = 'am-bar-phase am-phase-offline' }
        barEl.title = state.lastError || TEXTS.startHint
      } else if (state.interventionsEnabled === false) {
        if (phaseEl) { phaseEl.textContent = TEXTS.monitorOnly; phaseEl.className = 'am-bar-phase am-phase-offline' }
        barEl.title = TEXTS.title + ' · ' + TEXTS.monitorOnly
      } else {
        if (phaseEl) { phaseEl.textContent = PHASE_NAMES[currentPhase()]; phaseEl.className = 'am-bar-phase am-phase-' + currentPhase() }
        barEl.title = TEXTS.title + ' · ' + TEXTS.monitorOnline
      }
      var curSes = state.selected || currentGuiActive()
      if (curSes) barEl.title += ' · ' + shortId(curSes)
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


    // ── 欢迎层 + 更新横幅 ──
    var welcomeEl = null
    var updateBannerEl = null
    function ensureWelcome() {
      if (welcomeEl || !overlayHost) return
      welcomeEl = document.createElement('div')
      welcomeEl.className = 'am-welcome'
      welcomeEl.innerHTML = '<div class="am-welcome-card">'
        + '<div class="am-welcome-title">' + ICON_RADAR + ' ' + esc(TEXTS.welcomeTitle) + '</div>'
        + '<div class="am-welcome-sub">' + esc(TEXTS.welcomeSub) + '</div>'
        + '<div class="am-welcome-steps">' + esc(TEXTS.welcomeStep1) + '<br>' + esc(TEXTS.welcomeStep2) + '<br>' + esc(TEXTS.welcomeStep3) + '</div>'
        + '<div class="am-welcome-actions"><button class="am-btn am-btn-primary" data-am="welcome-go">' + esc(TEXTS.welcomeBtn) + '</button></div>'
        + '</div>'
      overlayHost.appendChild(welcomeEl)
      var go = welcomeEl.querySelector('[data-am=welcome-go]')
      if (go) {
        go.addEventListener('click', function () {
          try { localStorage.setItem(WELCOME_KEY, '1') } catch (e) {}
          state.welcome = false
          emit()
        })
      }
    }
    function removeWelcome() {
      if (welcomeEl) { welcomeEl.remove(); welcomeEl = null }
    }
    function ensureUpdateBanner() {
      if (updateBannerEl || !overlayHost) return
      updateBannerEl = document.createElement('div')
      updateBannerEl.className = 'am-update-banner'
      updateBannerEl.innerHTML = '<span class="am-badge-dot"></span>'
        + '<span>' + esc(TEXTS.updateAvailable.replace('{latest}', state.update.latest).replace('{current}', state.update.current)) + '</span>'
        + '<button class="am-btn" data-am="update-go">' + esc(TEXTS.updateNow) + '</button>'
        + '<button class="am-btn" data-am="update-no">' + esc(TEXTS.updateLater) + '</button>'
      overlayHost.appendChild(updateBannerEl)
      var go = updateBannerEl.querySelector('[data-am=update-go]')
      if (go) go.addEventListener('click', function () { window.open(state.update.releaseUrl || 'https://github.com/Aik358/dsh-anchored-monitor/releases', '_blank', 'noopener') })
      var no = updateBannerEl.querySelector('[data-am=update-no]')
      if (no) no.addEventListener('click', function () {
        try { localStorage.setItem(UPDATE_DISMISS_KEY, state.update.latest) } catch (e) {}
        state.update.dismissedFor = state.update.latest
        state.update.show = false
        emit()
      })
    }
    function removeUpdateBanner() {
      if (updateBannerEl) { updateBannerEl.remove(); updateBannerEl = null }
    }
    function syncOverlayLayers() {
      if (!overlayHost) return
      if (state.welcome) ensureWelcome()
      else removeWelcome()
      if (state.update.show && state.update.hasUpdate) ensureUpdateBanner()
      else removeUpdateBanner()
    }

    // ── 面板 ──
    function kpi(cls, label, value, sub) {
      return '<div class="am-kpi am-kpi-' + cls + '"><div class="am-kpi-label">' + esc(label) + '</div>'
        + '<div class="am-kpi-value">' + value + '</div><div class="am-kpi-sub">' + sub + '</div></div>'
    }
    function panelHtml() {
      return '<div class="am-panel-header" data-am="drag">'
        + '<div class="am-panel-top">'
        + '<div class="am-panel-title">' + ICON_RADAR + '<span class="am-title-text">' + esc(TEXTS.title) + '</span><span class="am-chip am-mono" data-am="ver">—</span></div>'
        + '<span class="am-chip am-chip-band" data-am="bandchip">—</span>'
        + '<span class="am-chip" data-am="statuschip">—</span>'
        + '</div>'
        + '<div class="am-panel-sub">'
        + (state.sessions.length > 1
            ? '<button class="am-ssel am-ssel-idle" data-am="ssel" title="' + esc(T('切换对话', 'Switch conversation')) + '"><span class="am-ssel-label" data-am="ssel-label">' + esc(state.selected ? shortId(state.selected) : '—') + '</span><span class="am-ssel-caret">▾</span></button>'
            : '<span class="am-sub-note" data-am="subnote"></span>')
        + '<div class="am-panel-actions">'
        + '<button class="am-btn am-iv-switch am-iv-on" data-am="ivtoggle" title="' + esc(TEXTS.ivSwitchTitle) + '"></button>'
        + '<button class="am-btn am-btn-ico" data-am="lang" title="' + esc(TEXTS.switchLang) + '">' + (langZh ? 'EN' : '中') + '</button>'
        + '<button class="am-btn am-btn-ico" data-am="ext" title="' + esc(TEXTS.openDashboard) + '">' + ICON_EXT + '</button>'
        + '<button class="am-btn am-btn-ico" data-am="min" title="' + esc(TEXTS.collapse) + '">' + ICON_MIN + '</button>'
        + '<button class="am-btn am-btn-ico" data-am="close" title="' + esc(TEXTS.close) + '">' + ICON_X + '</button>'
        + '</div></div></div>'
        + '<div class="am-offline" data-am="offline" style="display:none"></div>'
        + '<div class="am-iv-hint" data-am="ivhint" style="display:none"><span class="am-hint-ico">ℹ</span><span data-am="ivhint-text"></span></div>'
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
      var activeId = currentGuiActive()
      var activeKnown = !!(activeId && state.sessions.some(function (s) { return s.sessionId === activeId }))
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
      var sselBtn = panelEl.querySelector('[data-am=ssel]')
      if (sselBtn) {
        var scls = 'am-ssel am-ssel-idle'
        var stt = T('切换对话', 'Switch conversation')
        if (activeId === state.selected && activeKnown && activeId) {
          scls = 'am-ssel am-ssel-follow'
          stt = T('跟随当前对话 · ', 'following active · ') + activeId
        } else if (activeId && !activeKnown) {
          scls = 'am-ssel am-ssel-untracked'
          stt = T('当前对话未在监控(尚无思维链) · ', 'active not tracked yet · ') + (activeId || '')
        } else if (state.selected) {
          scls = 'am-ssel am-ssel-manual'
          stt = T('手动查看 ', 'manual watch ') + state.selected
        }
        sselBtn.className = scls
        sselBtn.title = stt
        var sselLbl = panelEl.querySelector('[data-am=ssel-label]')
        if (sselLbl) sselLbl.textContent = state.selected ? shortId(state.selected) : (state.sessions[0] ? shortId(state.sessions[0].sessionId) : '—')
      }
      var ivToggle = panelEl.querySelector('[data-am=ivtoggle]')
      if (ivToggle) {
        ivToggle.textContent = state.interventionsEnabled ? TEXTS.ivOn : TEXTS.ivOff
        ivToggle.className = 'am-btn am-iv-switch ' + (state.interventionsEnabled ? 'am-iv-on' : 'am-iv-off')
      }
      var off = panelEl.querySelector('[data-am=offline]')
      if (state.monitorOnline) {
        off.style.display = 'none'
      } else {
        off.style.display = 'block'
        off.textContent = state.lastError || TEXTS.startHint
      }
      var ivHint = panelEl.querySelector('[data-am=ivhint]')
      if (ivHint) {
        if (state.monitorOnline) {
          ivHint.style.display = 'block'
          ivHint.className = 'am-iv-hint' + (state.interventionsEnabled ? '' : ' off')
          ivHint.querySelector('[data-am=ivhint-text]').textContent = state.interventionsEnabled ? TEXTS.ivHintOn : TEXTS.ivHintOff
        } else {
          ivHint.style.display = 'none'
        }
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
          var cls = state.events[i].type === 'intervention_triggered' ? ' k-iv' : state.events[i].type === 'threshold_check' ? ' k-th' : state.events[i].type === 'guard_triggered' ? ' k-guard' : ''
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
      var subNote = panelEl.querySelector('[data-am=subnote]')
      if (subNote) {
        var lede = (activeId && !activeKnown)
          ? T('当前对话未在监控 · ', 'Active conversation not tracked · ')
          : ''
        subNote.textContent = lede + T('三波段', 'bands') + ' ' + state.thresholds.specMax + '/' + state.thresholds.reactMin
          + ' · ' + TEXTS.cooldown + ' L2 ' + (state.cooldowns.L2_ms / 1000).toFixed(0) + 's'
          + ' · ' + TEXTS.attempts + ' ' + (snap ? snap.l2Attempts : 0) + '/' + state.maxL2Attempts
          + (state.interventionsEnabled === false ? ' · ' + TEXTS.monitorOnly : '')
          + (snap && snap.cot && snap.cot.alerts > 0 ? ' · ' + TEXTS.cotStall + '/泄漏 ⚠ ' + snap.cot.alerts : '')
      }
      panelEl.querySelector('[data-am=foot]').textContent = (chartView.follow ? '⏺ ' : '⏸ ') + 'config ' + state.configHash
        + (snap && snap.cot ? ' · text ' + snap.cot.textChars + '字/' + snap.cot.textChunks + '块' : '')
        + ' · ' + state.monitorUrl
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
    // 图表视图窗口: follow=自动跟随最新; start/end=历史索引窗口; win=默认窗口点数
    var chartView = { start: 0, end: 0, win: 120, follow: true, _session: null }
    function drawChart() {
      if (!chartCanvas) return
      var snap = state.snapshot
      var dpr = window.devicePixelRatio || 1
      var W = chartCanvas.clientWidth || 640
      var H = chartCanvas.clientHeight || 240
      chartCanvas.width = Math.round(W * dpr)
      chartCanvas.height = Math.round(H * dpr)
      var ctx = chartCanvas.getContext('2d')
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = isDark() ? 'rgba(24,24,27,0.45)' : 'rgba(249,250,253,0.55)'
      ctx.fillRect(0, 0, W, H)
      var hist = snap && snap.history ? snap.history : []
      if (!hist.length) {
        ctx.fillStyle = isDark() ? '#5b6585' : '#98a2b3'
        ctx.font = '12px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(TEXTS.noData, W / 2, H / 2)
        return
      }
      var pad = { l: 38, r: 10, t: 10, b: 48 }
      var plotW = W - pad.l - pad.r
      var plotH = H - pad.t - pad.b
      var n = hist.length
      // 会话切换或第一次画: 重置到最新(跟随)
      if (snap && snap.sessionId && snap.sessionId !== chartView._session) {
        chartView._session = snap.sessionId
        chartView.start = 0
        chartView.end = 0
        chartView.follow = true
      }
      var win = Math.max(10, chartView.win || 120)
      if (chartView.follow || n <= win) {
        chartView.end = n
        chartView.start = Math.max(0, n - win)
      } else {
        if (chartView.end > n) { chartView.end = n; chartView.start = Math.max(0, n - win) }
        if (chartView.end - chartView.start < 2) chartView.start = Math.max(0, Math.min(n - 2, chartView.start))
      }
      var vs = chartView.start
      var ve = chartView.end
      var m = Math.max(1, ve - vs)
      var seg = hist.slice(vs, ve)
      var yOf = function (v) { return pad.t + plotH * (1 - Math.min(100, Math.max(0, v)) / 100) }
      var xOf = function (si) { return pad.l + (m === 1 ? plotW / 2 : (si / (m - 1)) * plotW) }
      ctx.font = '9px monospace'
      ctx.textAlign = 'right'
      for (var g = 0; g <= 100; g += 25) {
        var gy = yOf(g)
        ctx.strokeStyle = isDark() ? 'rgba(148,148,155,0.10)' : 'rgba(15,23,42,0.08)'
        ctx.beginPath()
        ctx.moveTo(pad.l, gy)
        ctx.lineTo(W - pad.r, gy)
        ctx.stroke()
        ctx.fillStyle = isDark() ? '#6b6b72' : '#98a2b3'
        ctx.fillText(String(g), pad.l - 6, gy + 3)
      }
      var stripW = Math.max(1, plotW / m)
      for (var i = 0; i < m; i++) {
        ctx.fillStyle = hexA(BAND_COLORS[seg[i].band] || BAND_COLORS.unknown, 0.10)
        ctx.fillRect(xOf(i) - stripW / 2, pad.t, stripW, plotH)
      }
      // 阈值线: 启用规则的线为实色; 未启用规则的线以淡色参考线显示(带 · 参考 标注),
      // 让用户能看到判断边界, 又不会误以为它们会触发干预。
      var floorActive = state.triggers && state.triggers.floor
      dashLine(ctx, yOf(state.thresholds.safetyFloor), pad, plotW,
        floorActive ? (isDark() ? 'rgba(248,113,113,0.65)' : 'rgba(220,38,38,0.55)') : (isDark() ? 'rgba(248,113,113,0.22)' : 'rgba(220,38,38,0.20)'),
        'floor ' + state.thresholds.safetyFloor + (floorActive ? '' : ' · ref'))
      var sigmaActive = state.triggers && state.triggers.sigma
      if (snap.baseline && snap.baseline.mean != null) {
        dashLine(ctx, yOf(snap.baseline.mean), pad, plotW,
          sigmaActive ? (isDark() ? 'rgba(232,236,248,0.5)' : 'rgba(77,107,254,0.55)') : (isDark() ? 'rgba(148,148,155,0.22)' : 'rgba(77,107,254,0.18)'),
          'μ ' + snap.baseline.mean.toFixed(0) + (sigmaActive ? '' : ' · ref'))
      }
      var grad = ctx.createLinearGradient(pad.l, 0, W - pad.r, 0)
      grad.addColorStop(0, '#4d6bfe')
      grad.addColorStop(1, '#22d3ee')
      ctx.strokeStyle = grad
      ctx.lineWidth = 1.8
      ctx.lineJoin = 'round'
      ctx.beginPath()
      for (var i2 = 0; i2 < m; i2++) {
        var x = xOf(i2)
        var y = yOf(seg[i2].normalizedScore)
        if (i2 === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
      if (snap.interventions) {
        var seqToX = {}
        seg.forEach(function (pp, i3) { seqToX[pp.sequence] = xOf(i3) })
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
      drawMiniMap(ctx, W, H, pad, plotW, plotH, hist, vs, ve, n)
    }
    function drawMiniMap(ctx, W, H, pad, plotW, plotH, hist, vs, ve, n) {
      if (!hist.length) return
      var mw = plotW
      var mh = 22
      var mx = pad.l
      var my = pad.t + plotH + 10
      ctx.fillStyle = isDark() ? 'rgba(26,28,34,0.72)' : 'rgba(245,246,250,0.72)'
      ctx.fillRect(mx - 4, my - 3, mw + 12, mh + 14)
      ctx.strokeStyle = isDark() ? 'rgba(148,148,155,0.25)' : 'rgba(15,23,42,0.14)'
      ctx.lineWidth = 1
      ctx.strokeRect(mx - 4, my - 3, mw + 12, mh + 14)
      if (n < 2) return
      var gx = function (idx) { return mx + (n === 1 ? mw / 2 : (idx / (n - 1)) * mw) }
      var gy = function (v) { return my + mh * (1 - Math.min(100, Math.max(0, v)) / 100) }
      ctx.strokeStyle = isDark() ? 'rgba(124,140,255,0.6)' : 'rgba(77,107,254,0.55)'
      ctx.lineWidth = 1.2
      ctx.beginPath()
      var step = Math.max(1, Math.ceil(n / 260))
      var moved = false
      for (var i = 0; i < n; i += step) {
        var x = gx(i)
        var y = gy(hist[i].normalizedScore)
        if (!moved) { ctx.moveTo(x, y); moved = true }
        else ctx.lineTo(x, y)
      }
      if (!moved && n > 0) ctx.moveTo(gx(0), gy(hist[0].normalizedScore))
      ctx.stroke()
      var li = n - 1
      ctx.fillStyle = '#22d3ee'
      ctx.beginPath()
      ctx.arc(gx(li), gy(hist[li].normalizedScore), 2.6, 0, Math.PI * 2)
      ctx.fill()
      var fx0 = mx + (Math.max(0, vs) / n) * mw
      var fx1 = mx + (Math.min(n, ve) / n) * mw
      if (fx1 - fx0 < 6) fx1 = fx0 + 6
      ctx.fillStyle = 'rgba(77,107,254,0.14)'
      ctx.fillRect(fx0, my - 2, fx1 - fx0, mh + 2)
      ctx.strokeStyle = 'rgba(77,107,254,0.75)'
      ctx.lineWidth = 1
      ctx.strokeRect(fx0, my - 2, fx1 - fx0, mh + 2)
      ctx.fillStyle = isDark() ? '#6b6b72' : '#98a2b3'
      ctx.font = '8.5px sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText((chartView.follow ? '⏺ ' : '⏸ ') + (chartView.follow
        ? T('自动跟随最新 · 拖动下部迷你条漫游 / 滚轮缩放 / 双击恢复', 'auto follows latest · drag the mini-bar to pan, wheel zooms, double-click to resume')
        : T('手动漫游 · 双击恢复跟随最新', 'manual · double-click to follow latest')), mx - 2, my + mh + 12)
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
      var langBtn = panelEl.querySelector('[data-am=lang]')
      if (langBtn) langBtn.addEventListener('click', function () { toggleLang() })
      var ivT = panelEl.querySelector('[data-am=ivtoggle]')
      if (ivT) ivT.addEventListener('click', function () {
        var next = !state.interventionsEnabled
        state.interventionsEnabled = next
        emit()
        fetch('/api/anchored-monitor/intervention', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ enabled: next })
        }).catch(function () {})
      })
      var ext = panelEl.querySelector('[data-am=ext]')
      if (ext) ext.addEventListener('click', function () { window.open(state.monitorUrl || 'http://127.0.0.1:9301', '_blank', 'noopener') })
      var min = panelEl.querySelector('[data-am=min]')
      if (min) min.addEventListener('click', function () { setPanelOpen(false) })
      var close = panelEl.querySelector('[data-am=close]')
      if (close) close.addEventListener('click', function () { setPanelOpen(false) })
      var sselBtn = panelEl.querySelector('[data-am=ssel]')
      if (sselBtn) {
        var sselPop = null
        var closeSsel = function () {
          if (sselPop) { sselPop.remove(); sselPop = null }
          document.removeEventListener('pointerdown', onSselDoc, true)
        }
        var onSselDoc = function (ev) {
          if (sselPop && !sselPop.contains(ev.target) && ev.target !== sselBtn && !sselBtn.contains(ev.target)) closeSsel()
        }
        sselBtn.addEventListener('click', function (ev) {
          ev.stopPropagation()
          if (sselPop) { closeSsel(); return }
          sselPop = document.createElement('div')
          sselPop.className = 'am-ssel-pop'
          sselPop.setAttribute('role', 'listbox')
          var items = state.sessions.map(function (s) {
            var cur = s.sessionId === state.selected ? ' am-ssel-cur' : ''
            var meta = []
            if (s.band && s.band !== 'unknown') meta.push(s.band)
            if (s.normalizedScore != null) meta.push(Number(s.normalizedScore).toFixed(1))
            return '<button class="am-ssel-item' + cur + '" role="option" data-id="' + esc(s.sessionId) + '" title="' + esc(s.sessionId) + '">'
              + '<span class="am-ssel-id">' + esc(shortId(s.sessionId)) + '</span>'
              + '<span class="am-ssel-meta am-mono">' + esc(meta.join(' · ')) + '</span></button>'
          }).join('')
          sselPop.innerHTML = items || '<div class="am-ssel-empty">' + esc(T('暂无会话数据', 'no sessions yet')) + '</div>'
          sselPop.addEventListener('click', function (e2) {
            var b = e2.target && e2.target.closest ? e2.target.closest('[data-id]') : null
            if (!b) return
            var v = b.getAttribute('data-id')
            if (v && v !== state.selected) { state.selected = v; lastManualAt = Date.now(); pollOnce() }
            closeSsel()
          })
          document.body.appendChild(sselPop)
          var rr = sselBtn.getBoundingClientRect()
          var top = Math.min(Math.max(8, rr.bottom + 6), window.innerHeight - sselPop.offsetHeight - 8)
          var left = Math.min(rr.left, Math.max(8, window.innerWidth - sselPop.offsetWidth - 8))
          sselPop.style.top = top + 'px'
          sselPop.style.left = left + 'px'
          document.addEventListener('pointerdown', onSselDoc, true)
        })
      }
      bindChartInteractions(panelEl.querySelector('[data-am=chart]'))
    }
    function bindChartInteractions(cc) {
      if (!cc || cc._amViewBound) return
      cc._amViewBound = true
      var drag = null
      var CHART_PAD = { l: 38, r: 10, t: 10, b: 48 }
      cc.addEventListener('pointerdown', function (ev) {
        var rect = cc.getBoundingClientRect()
        var insideMini = (ev.clientY - rect.top) > rect.height - 46
        if (!insideMini) return
        var plotW = Math.max(1, rect.width - CHART_PAD.l - CHART_PAD.r)
        var n = state.snapshot && state.snapshot.history ? state.snapshot.history.length : 0
        if (n <= 1) return
        var ratio = Math.min(1, Math.max(0, (ev.clientX - rect.left - CHART_PAD.l) / plotW))
        var winCalc = Math.max(10, (chartView.end - chartView.start) || chartView.win || 120)
        chartView.follow = false
        chartView.start = Math.max(0, Math.min(n - winCalc, Math.round(ratio * n - winCalc / 2)))
        chartView.end = Math.min(n, chartView.start + winCalc)
        drag = { n: n, w: winCalc }
        try { cc.setPointerCapture(ev.pointerId) } catch (e) {}
        drawChart()
      })
      cc.addEventListener('pointermove', function (ev) {
        if (!drag) return
        var rect = cc.getBoundingClientRect()
        var plotW = Math.max(1, rect.width - CHART_PAD.l - CHART_PAD.r)
        var ratio = Math.min(1, Math.max(0, (ev.clientX - rect.left - CHART_PAD.l) / plotW))
        chartView.follow = false
        chartView.start = Math.max(0, Math.min(drag.n - drag.w, Math.round(ratio * drag.n - drag.w / 2)))
        chartView.end = Math.min(drag.n, chartView.start + drag.w)
        drawChart()
      })
      var endDrag = function () { drag = null }
      cc.addEventListener('pointerup', endDrag)
      cc.addEventListener('pointercancel', endDrag)
      cc.addEventListener('wheel', function (ev) {
        ev.preventDefault()
        var n = state.snapshot && state.snapshot.history ? state.snapshot.history.length : 0
        if (n < 4) return
        var cur = (chartView.end - chartView.start) || chartView.win || 120
        var newWin = Math.round(cur * (ev.deltaY > 0 ? 1.25 : 0.8))
        newWin = Math.max(10, Math.min(n, newWin))
        if (!chartView.follow) {
          var center = (chartView.start + chartView.end) / 2
          chartView.start = Math.max(0, Math.min(n - newWin, Math.round(center - newWin / 2)))
        } else {
          chartView.end = n
          chartView.start = Math.max(0, n - newWin)
        }
        chartView.win = newWin
        if (!chartView.follow) chartView.end = Math.min(n, chartView.start + newWin)
        drawChart()
      }, { passive: false })
      cc.addEventListener('dblclick', function () { chartView.follow = true; drawChart() })
    }


    // ══════════════════════════ part 4: 设置页(settings.section) ══════════════════════════

    var SETTINGS_STYLE = [
      '.am-settings{position:relative;--am-blue:#4d6bfe;--am-text:#101828;--am-muted:#667085;--am-faint:#98a2b3;',
      '--am-border:rgba(16,24,40,0.10);--am-border-strong:rgba(16,24,40,0.18);--am-card:#ffffff;--am-bg:#f6f8fc;',
      'font-family:-apple-system,"Segoe UI","PingFang SC","Microsoft YaHei",system-ui,sans-serif;color:var(--am-text)}',
      'body[data-ds-dark-theme] .am-settings{--am-text:#ececee;--am-muted:#9a9aa2;--am-faint:#6b6b72;',
      '--am-border:rgba(148,148,155,0.14);--am-border-strong:rgba(148,148,155,0.26);--am-card:rgba(148,148,155,0.08);--am-bg:rgba(24,24,27,0.4)}',
      '.am-settings *{box-sizing:border-box}',
      '.am-settings{display:flex;flex-direction:column;gap:18px;padding:4px 2px 96px}',
      '.am-set-status{display:flex;align-items:center;gap:8px;padding:10px 14px;border-radius:12px;font-size:12.5px;',
      'border:1px solid var(--am-border);background:var(--am-card);color:var(--am-muted)}',
      '.am-set-status b{color:var(--am-text);font-weight:650}',
      '.am-status-dot{width:8px;height:8px;border-radius:50%;background:#9ca3af;flex:none}',
      '.am-status-dot.on{background:#16a34a;box-shadow:0 0 8px rgba(22,163,74,0.7)}',
      '.am-status-dot.off{background:#dc2626;box-shadow:0 0 8px rgba(220,38,38,0.7)}',
      '.am-set-group{display:flex;flex-direction:column;gap:14px}',
      '.am-set-group-head{display:flex;flex-direction:column;gap:3px;padding-bottom:8px;border-bottom:1px solid var(--am-border)}',
      '.am-set-group-title{font-size:14.5px;font-weight:700;color:var(--am-text)}',
      '.am-set-group-desc{font-size:12px;color:var(--am-muted);line-height:1.55}',
      '.am-set-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px 18px}',
      '.am-set-field{display:flex;flex-direction:column;gap:6px;min-width:0}',
      '.am-set-field.wide{grid-column:1 / -1}',
      '.am-set-label{font-size:12.5px;font-weight:600;color:var(--am-text);display:flex;align-items:center;gap:6px}',
      '.am-set-hint{font-size:11.5px;color:var(--am-muted);line-height:1.5}',
      '.am-set-input,.am-set-select,.am-set-textarea{width:100%;padding:8px 10px;border-radius:9px;border:1px solid var(--am-border-strong);',
      'background:var(--am-card);color:var(--am-text);font-size:13px;font-family:inherit;outline:none;transition:border-color .15s ease,box-shadow .15s ease}',
      '.am-set-input:focus,.am-set-select:focus,.am-set-textarea:focus{border-color:var(--am-blue);box-shadow:0 0 0 3px rgba(77,107,254,0.14)}',
      '.am-set-textarea{resize:vertical;min-height:64px;font-family:"JetBrains Mono",Consolas,monospace;font-size:12px;line-height:1.6}',
      '.am-set-toggle{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;border:1px solid var(--am-border);',
      'background:var(--am-card);cursor:pointer;user-select:none}',
      '.am-set-toggle input{accent-color:var(--am-blue);width:15px;height:15px}',
      '.am-set-toggle span{font-size:12.5px;color:var(--am-text)}',
      '.am-set-toggle .am-set-hint{flex:1;text-align:right}',
      '.am-set-savebar{position:sticky;bottom:14px;margin-top:6px;display:flex;align-items:center;gap:14px;padding:12px 14px;border-radius:14px;',
      'border:1px solid var(--am-border-strong);background:rgba(255,255,255,0.85);box-shadow:0 12px 34px rgba(16,24,40,0.14);',
      'backdrop-filter:blur(16px) saturate(160%);-webkit-backdrop-filter:blur(16px) saturate(160%);z-index:5}',
      'body[data-ds-dark-theme] .am-set-savebar{background:rgba(28,28,31,0.88)}',
      '.am-set-savebar-note{flex:1;font-size:11.5px;color:var(--am-muted);line-height:1.5}',
      '.am-set-save{display:inline-flex;align-items:center;gap:7px;padding:9px 22px;border-radius:10px;border:none;cursor:pointer;',
      'background:linear-gradient(135deg,#4d6bfe,#3b5bdb);color:#fff;font-size:13.5px;font-weight:650;',
      'box-shadow:0 6px 16px rgba(77,107,254,0.35);transition:transform .12s ease,box-shadow .12s ease}',
      '.am-set-save:hover{transform:translateY(-1px);box-shadow:0 9px 20px rgba(77,107,254,0.4)}',
      '.am-set-save:disabled{opacity:.55;cursor:default;transform:none}',
      '.am-set-reset{display:inline-flex;align-items:center;gap:7px;padding:9px 18px;border-radius:10px;border:1px solid var(--am-border-strong);',
      'cursor:pointer;background:transparent;color:var(--am-muted);font-size:13px;transition:all .15s ease}',
      '.am-set-reset:hover{border-color:rgba(220,38,38,0.55);color:#dc2626;background:rgba(220,38,38,0.06)}',
      '.am-set-toast{position:fixed;right:22px;bottom:22px;z-index:2147483100;padding:11px 16px;border-radius:12px;font-size:12.5px;',
      'border:1px solid var(--am-border-strong);background:rgba(255,255,255,0.92);color:var(--am-text);',
      'box-shadow:0 14px 40px rgba(16,24,40,0.2);backdrop-filter:blur(14px);animation:am-toast-in .18s ease}',
      'body[data-ds-dark-theme] .am-set-toast{background:rgba(28,28,31,0.92)}',
      '.am-set-toast.ok{border-color:rgba(22,163,74,0.5)}',
      '.am-set-toast.err{border-color:rgba(220,38,38,0.5)}',
      '@keyframes am-toast-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}',
      // ── 皮肤选择 ──
      '.am-set-skins{display:grid;grid-template-columns:1fr 1fr;gap:12px}',
      '.am-skin-card{padding:12px 14px;border-radius:12px;border:1px solid var(--am-border);background:var(--am-card);cursor:pointer;display:flex;flex-direction:column;gap:8px;transition:border-color .15s ease,box-shadow .15s ease}',
      '.am-skin-card:hover{border-color:var(--am-border-strong)}',
      '.am-skin-card.active{border-color:var(--am-blue);box-shadow:0 0 0 3px rgba(77,107,254,0.14)}',
      '.am-skin-card-head{display:flex;align-items:center;gap:8px}',
      '.am-skin-check{width:16px;height:16px;border-radius:50%;border:1px solid var(--am-border-strong);flex:none;display:flex;align-items:center;justify-content:center;font-size:10px;color:#fff}',
      '.am-skin-card.active .am-skin-check{background:var(--am-blue);border-color:var(--am-blue)}',
      '.am-skin-title{font-size:13px;font-weight:700;color:var(--am-text)}',
      '.am-skin-desc{font-size:11.5px;color:var(--am-muted);line-height:1.55}',
      '.am-skin-pv{display:flex;align-items:center;gap:6px;padding:7px 8px;border-radius:8px;background:var(--am-bg)}',
      '.am-skin-pv .pv-track{position:relative;flex:1;height:6px;border-radius:99px;background:rgba(16,24,40,0.10)}',
      'body[data-ds-dark-theme] .am-skin-pv .pv-track{background:rgba(148,148,155,0.16)}',
      '.am-skin-pv .pv-fill{position:absolute;left:0;top:0;bottom:0;border-radius:99px;background:linear-gradient(90deg,#4d6bfe,#22d3ee)}',
      '.am-skin-pv .pv-score{font-size:11px;font-weight:700;color:var(--am-text);font-family:"JetBrains Mono",Consolas,monospace}',
      '.am-skin-faces{display:flex;gap:3px;align-items:center}',
      '.am-skin-faces img{width:24px;height:24px;border-radius:5px;object-fit:cover;border:1px solid var(--am-border)}',
      '.am-skin-faces b{font-size:11.5px;color:var(--am-text);margin-left:4px;white-space:nowrap}'
    ].join('\n')

    var settingsStyleInjected = false
    function injectSettingsStyle() {
      if (settingsStyleInjected) return
      settingsStyleInjected = true
      var tag = document.createElement('style')
      tag.setAttribute('data-am-settings-style', '1')
      tag.textContent = SETTINGS_STYLE
      document.head.appendChild(tag)
    }

    var setState = {
      loaded: false,
      monitorOnline: false,
      host: null,
      effective: null,
      saving: false,
      error: ''
    }

    function getPath(obj, path) {
      var cur = obj
      var parts = path.split('.')
      for (var i = 0; i < parts.length; i++) {
        if (cur == null) return undefined
        cur = cur[parts[i]]
      }
      return cur
    }
    function setPath(obj, path, value) {
      var parts = path.split('.')
      var cur = obj
      for (var i = 0; i < parts.length - 1; i++) {
        if (typeof cur[parts[i]] !== 'object' || cur[parts[i]] === null) cur[parts[i]] = {}
        cur = cur[parts[i]]
      }
      cur[parts[parts.length - 1]] = value
    }

    /** 字段表: 全部技术参数(分组/路径/类型/提示) */
    function fieldSpecs() {
      var F = function (id, label, hint, kind, path, opts) {
        var o = { id: id, label: label, hint: hint, kind: kind, path: path }
        if (opts) for (var k in opts) o[k] = opts[k]
        return o
      }
      var n = 'number'
      return [
        {
          group: 'runtime', title: T('运行', 'Runtime'), desc: T('监控进程由 DSH 启动时自动拉起(15 秒看门狗保活), 用户零操作。', 'The monitor process is auto-started with DSH (15s watchdog keeps it alive) — zero manual steps.'),
          fields: [
            F('autoStart', T('自动启动监控进程', 'Auto-start monitor'), T('DSH 启动即检测并拉起独立监控进程', 'Detect and spawn the monitor on DSH startup'), 'toggle', 'host.autoStart'),
            F('enabled', T('插件总开关', 'Plugin enabled'), T('关闭后停止推送与干预, 面板进入离线态', 'Disables push + interventions'), 'toggle', 'host.enabled'),
            F('profile', T('配置 Profile', 'Config profile'), T('default=研究默认 / spec=高敏感 / safe=保守 / demo=演示加速冷却', 'default=research defaults / spec=sensitive / safe=conservative / demo=fast cooldowns'), 'select', 'host.profile', { options: ['default', 'spec', 'safe', 'demo'] }),
            F('monitorUrl', T('监控进程地址', 'Monitor URL'), T('端口在下方「服务端口」修改后会自动联动', 'Follows the port field below'), 'text', 'host.monitorUrl'),
            F('port', T('服务端口', 'HTTP port'), T('监控进程 HTTP/仪表盘端口(保存后重启生效)', 'Monitor HTTP/dashboard port (restarts on save)'), n, 'override.dashboard.port', { min: 1024, max: 65535 })
          ]
        },
        {
          group: 'window', title: T('窗口聚合', 'Window'), desc: T('指纹按滑窗/指数衰减窗聚合; 窗口越大越稳、越小越敏感。', 'Fingerprints aggregate over a sliding or decay window; larger = stabler, smaller = more sensitive.'),
          fields: [
            F('windowType', T('窗口类型', 'Type'), T('decay 更强调近期行为', 'decay weights recent blocks more'), 'select', 'override.window.type', { options: ['sliding', 'decay'] }),
            F('windowSize', T('窗口大小', 'Size'), T('滑窗块数(2-100)', 'sliding blocks (2-100)'), n, 'override.window.size', { min: 2, max: 100 }),
            F('decayLambda', T('衰减系数 λ', 'Decay lambda'), T('指数衰减速率(0-1)', 'decay rate (0-1)'), n, 'override.window.decay_lambda', { min: 0, max: 1, step: 0.01 })
          ]
        },
        {
          group: 'scoring', title: T('评分策略', 'Scoring'), desc: T('加权比公式 score=(α·P+β·N)/(γ·neg+ε); 归一化分=原始分在历史中的分位(0-100)。', 'score = (α·P + β·N) / (γ·neg + ε); normalized = percentile rank over history (0-100).'),
          fields: [
            F('alpha', 'α(正向)', 'α (positive)', T('we 系词聚合权重', 'weight of positive aggregate'), n, 'override.scoring.weights.alpha', { min: 0, max: 10, step: 0.1 }),
            F('beta', 'β(中性)', 'β (neutral)', T('规划标记/验证词权重', 'weight of neutral aggregate'), n, 'override.scoring.weights.beta', { min: 0, max: 10, step: 0.1 }),
            F('gamma', 'γ(负向惩罚)', 'γ (negative)', T('let me 系惩罚权重', 'penalty of negative aggregate'), n, 'override.scoring.weights.gamma', { min: 0, max: 10, step: 0.1 }),
            F('epsilon', 'ε(平滑)', 'ε (smooth)', T('分母平滑项, 防除零', 'denominator smoothing'), n, 'override.scoring.weights.epsilon', { min: 0.01, max: 10, step: 0.1 }),
            F('normalize', T('分位数归一化', 'Percentile normalize'), T('映射到 0-100; 关闭则用原始分', 'map to 0-100; off = raw score'), 'toggle', 'override.scoring.normalize'),
            F('percentileWindow', T('分位窗口', 'Percentile window'), T('归一化历史长度(10-2000)', 'history length (10-2000)'), n, 'override.scoring.percentile_window', { min: 10, max: 2000 })
          ]
        },
        {
          group: 'bands', title: T('三波段量化', 'Three bands'), desc: T('按 dsh-router-standard bandOf 实测: ratio<spec_max→spec; <react_min→mixed(过渡带); ≥react_min→react。ratio=let me 数/(正向词数+let me 数)。', 'router-standard bandOf: ratio<spec_max→spec; <react_min→mixed; ≥react_min→react.'),
          fields: [
            F('specMax', T('spec 上界', 'spec_max'), T('过渡带起点(实测稳定区 0..0.15, 量化边界 0.2)', 'transition-band entry (measured stable 0..0.15, boundary 0.2)'), n, 'override.bands.spec_max', { min: 0.05, max: 0.45, step: 0.05 }),
            F('reactMin', T('react 下界', 'react_min'), T('react 带起点(实测 0.5..1.0 行为一致)', 'react-band entry (measured 0.5..1.0 alike)'), n, 'override.bands.react_min', { min: 0.3, max: 0.8, step: 0.05 })
          ]
        },
        {
          group: 'threshold', title: T('阈值与趋势', 'Threshold & trend'), desc: T('主检测=波段跨越; sigma/percentile/safety_floor 为可选统计规则(基于分位数, 噪声较大)。恢复迟滞: 回到 spec 带才解除告警。', 'Primary detection = band crossing; statistical rules are opt-in. Recovery is hysteretic: back into spec band.'),
          fields: [
            F('minSamples', T('基线最小样本', 'baseline_min_samples'), T('基线就绪前不判定(band=unknown)', 'no decisions before baseline is ready'), n, 'override.threshold.baseline_min_samples', { min: 3, max: 100 }),
            F('baseWindow', T('基线窗口', 'baseline_window'), T('均值/标准差计算窗口', 'mean/std window'), n, 'override.threshold.baseline_window', { min: 5, max: 500 }),
            F('trendWindow', T('趋势窗口', 'trend_window'), T('近期 vs 前一窗口均值漂移', 'recent vs previous mean drift'), n, 'override.threshold.trend_window', { min: 2, max: 50 }),
            F('slopeSigma', T('趋势斜率阈值', 'trend_slope_sigma'), T('漂移>k·σ 判上升/下降', 'drift > k·σ counts as trend'), n, 'override.threshold.trend_slope_sigma', { min: 0, max: 2, step: 0.05 }),
            F('safetyFloor', T('安全线', 'safety_floor'), T('原始分绝对低线(可选规则用)', 'absolute low line (optional rule)'), n, 'override.threshold.safety_floor', { min: 0, max: 100 }),
            F('trMixed', T('触发: 过渡带', 'trigger mixed_band'), T('进入 0.2-0.5 过渡带 → L1 警告(研究: 过渡带得分低于任一稳定带)', 'entering the mixed band fires L1'), 'toggle', 'trig.mixed'),
            F('trReact', T('触发: react 带', 'trigger react_band'), T('ratio≥react_min → L2 重置', 'entering the react band fires L2'), 'toggle', 'trig.react'),
            F('trSigma', T('触发: σ 规则', 'trigger sigma'), T('归一化分低于 μ−kσ(统计噪声大, 建议关闭)', 'normalized < μ−kσ (noisy, suggested off)'), 'toggle', 'trig.sigma'),
            F('sigmaK', 'σ 倍数 k', 'sigma k', T('低于 μ−kσ 触发', 'fires below μ−kσ'), n, 'override.threshold.sigmaK', { min: 0.5, max: 4, step: 0.1 }),
            F('trPercentile', T('触发: 分位规则', 'trigger percentile'), T('原始分位低于 p 触发(噪声大, 建议关闭)', 'raw percentile below p (noisy, suggested off)'), 'toggle', 'trig.percentile'),
            F('percentileP', '分位 p', 'percentile p', T('低于该分位触发', 'fires below this percentile'), n, 'override.threshold.percentileP', { min: 1, max: 25 }),
            F('trFloor', T('触发: 安全线', 'trigger safety_floor'), T('原始分低于安全线触发', 'raw score below floor fires'), 'toggle', 'trig.floor'),
            F('recoveryType', T('恢复判定', 'recovery type'), T('spec_band=ratio 回到 spec 带(推荐); sigma/safety_floor=分数回线', 'spec_band=back into spec band (recommended)'), 'select', 'override.threshold.recovery.type', { options: ['spec_band', 'sigma', 'safety_floor'] }),
            F('recoveryK', '恢复 σ 倍数', 'recovery k', T('恢复阈值 μ−kσ(sigma 模式)', 'recovery threshold (sigma mode)'), n, 'override.threshold.recovery.k', { min: 0, max: 3, step: 0.1 })
          ]
        },
        {
          group: 'intervention', title: T('干预策略', 'Intervention'), desc: T('L1 温和引导(措辞纪律: 只能建议式, 命令式会把 we 轨迹打回 let me); L2 强制重置(persona=Minimal 46 字符句 + 双工具); L3 建议重启。提示: 干预建议仅在 DeepSeek V4 Pro 0813 时开启, 其他模型请关闭(只监控)。', 'L1 suggestive hint (never imperative); L2 minimal persona + bootstrap pair; L3 restart advice. Tip: enable interventions only for DeepSeek V4 Pro 0813; keep them off (monitor-only) otherwise.'),
          fields: [
            F('l1ms', T('L1 冷却(ms)', 'L1 cooldown'), T('冷却期内不重复触发同级别', 'per-level cooldown'), n, 'override.intervention.cooldowns.L1_ms', { min: 0, max: 3600000 }),
            F('l2ms', T('L2 冷却(ms)', 'L2 cooldown'), T('重置后静默期', 'silence after reset'), n, 'override.intervention.cooldowns.L2_ms', { min: 0, max: 3600000 }),
            F('l3ms', T('L3 冷却(ms)', 'L3 cooldown'), T('重启建议冷却', 'restart-advice cooldown'), n, 'override.intervention.cooldowns.L3_ms', { min: 0, max: 3600000 }),
            F('maxL2', T('L2 重试上限', 'max_L2_attempts'), T('超限升级 L3', 'exhausted → L3'), n, 'override.intervention.max_L2_attempts', { min: 1, max: 20 }),
            F('hints', T('L1 提示模板(每行一条)', 'L1 hint templates (one per line)'), T('建议式措辞示例: reading the index is recommended — it is short', 'suggestive wording only'), 'textarea', 'override.intervention.hint_templates', { lines: true }),
            F('bootTools', T('L2 重置工具(逗号分隔)', 'L2 bootstrap tools'), T('官方 Minimal 精确双工具', 'the official Minimal tool pair'), 'text', 'override.intervention.bootstrap_tools', { commaList: true }),
            F('bootPrompt', T('L2 重置 persona', 'L2 bootstrap persona'), T('逐字节等同官方 Minimal 的 46 字符句', 'byte-identical to the Minimal persona'), 'text', 'override.intervention.bootstrap_system_prompt')
          ]
        },
        {
          group: 'guards', title: T('CoT 守卫', 'CoT guard'), desc: T('监控 text 信道(可见正文)的两类退化——思考样式泄漏进正文(text_leak)与推理信道停摆但仍出正文(streaming_stall)。仅告警、不自动干预。', 'Watches the text channel (visible body) for two degradations — thinking-style text leaking into the reply (text_leak) and reasoning stalling while text keeps flowing (streaming_stall). Alert-only.'),
          fields: [
            F('cotEnabled', T('启用守卫', 'Enable guard'), T('关闭后不再接收/统计 text 信道', 'off = no text-channel tracking'), 'toggle', 'override.guards.cot.enabled'),
            F('stallMs', T('停摆判定(ms)', 'reasoning_stall_ms'), T('无新 reasoning 块超过该时长即判停摆(需 text 仍在出内容)', 'no reasoning block this long = stall (text must still flow)'), n, 'override.guards.cot.reasoning_stall_ms', { min: 1000, max: 3600000 }),
            F('textActiveMs', T('活跃窗口(ms)', 'text_active_window_ms'), T('最近 text 块在该窗口内才算"仍在出内容"', 'text within this window counts as active'), n, 'override.guards.cot.text_active_window_ms', { min: 1000, max: 120000 }),
            F('surgeMs', T('泄漏窗口(ms)', 'text_surge_window_ms'), T('统计该窗口内的 text 字符数', 'chars counted over this window'), n, 'override.guards.cot.text_surge_window_ms', { min: 1000, max: 300000 }),
            F('surgeChars', T('泄漏字符阈值', 'text_surge_chars'), T('窗口内 text 超该阈值才进入指纹判定', 'window chars above this enters fingerprint check'), n, 'override.guards.cot.text_surge_chars', { min: 500, max: 100000 }),
            F('leakRatio', T('泄漏指纹比', 'text_leak_ratio'), T('text 中 let me/(we+let me) ≥ 该值判泄漏 (default 0.6)', 'text negative/(pos+neg) ≥ this = leak (default 0.6)'), n, 'override.guards.cot.text_leak_ratio', { min: 0.1, max: 1, step: 0.05 }),
            F('cotCooldown', T('告警冷却(ms)', 'cooldown_ms'), T('同种告警最小间隔, 防刷屏', 'min interval between same-kind alerts'), n, 'override.guards.cot.cooldown_ms', { min: 1000, max: 3600000 })
          ]
        },
        {
          group: 'lexicon', title: T('词典(指纹)', 'Lexicon (fingerprint)'), desc: T('格式: 每行 "term: weight"。正向=spec 轨迹(we/let\'s); 负向只放 react 指纹(let me); i will/i need 等规划标记放中性。', 'Format: "term: weight" per line. positive=spec trajectory; negative=react fingerprints only; planning markers go neutral.'),
          fields: [
            F('lexPos', T('正向词', 'positive'), T('we: 2.0 这类, 支持词边界匹配', 'word-boundary matched'), 'textarea', 'override.features.lexicon.positive', { lines: true }),
            F('lexNeg', T('负向词', 'negative'), T('只放 let me 类 react 指纹', 'react fingerprints only'), 'textarea', 'override.features.lexicon.negative', { lines: true }),
            F('lexNeu', T('中性词', 'neutral'), T('i will / i need / check 等规划标记', 'planning markers'), 'textarea', 'override.features.lexicon.neutral', { lines: true })
          ]
        },
        {
          group: 'log', title: T('实验日志', 'Experiment log'), desc: T('JSONL 事件流(block/窗口/评分/阈值/干预), 供离线回放与校准。', 'JSONL event stream for replay & calibration.'),
          fields: [
            F('logPath', T('日志路径', 'path'), T('相对项目根或绝对路径', 'relative to package root or absolute'), 'text', 'override.experiment_log.path'),
            F('logSize', T('轮转大小(MB)', 'max size MB'), T('超限重命名为 .<时间戳>', 'rotated with a timestamp suffix'), n, 'override.experiment_log.max_file_size_mb', { min: 1, max: 1024 }),
            F('logRotate', T('启用轮转', 'rotate'), T('关闭则一直追加', 'append forever when off'), 'toggle', 'override.experiment_log.rotate'),
            F('pollMs', T('日志轮询间隔(ms)', 'log poll ms'), T('log_tail 模式的轮询间隔', 'poll interval for log_tail mode'), n, 'override.event_source.poll_interval_ms', { min: 10, max: 5000 })
          ]
        }
      ]
    }

    /** 把值序列化为 overrides(JSON 深路径) */
    function collectOverrides(values) {
      var o = {}
      for (var key in values) {
        if (key.indexOf('override.') !== 0) continue
        var path = key.slice('override.'.length)
        if (path === 'threshold.sigmaK' || path === 'threshold.percentileP') continue
        setPath(o, path, values[key])
      }
      // 触发规则数组(由开关重建)
      var trig = []
      if (values['trig.mixed'] !== false) trig.push({ type: 'mixed_band', severity: 'warning' })
      if (values['trig.react'] !== false) trig.push({ type: 'react_band', severity: 'critical' })
      if (values['trig.sigma']) trig.push({ type: 'sigma', k: Number(values['override.threshold.sigmaK'] ?? 1.5), severity: 'warning' })
      if (values['trig.percentile']) trig.push({ type: 'percentile', p: Number(values['override.threshold.percentileP'] ?? 5), severity: 'warning' })
      if (values['trig.floor']) trig.push({ type: 'safety_floor', severity: 'critical' })
      setPath(o, 'threshold.trigger', trig)
      // 提示模板: 每行一条
      var hints = String(values['override.intervention.hint_templates'] ?? '')
        .split('\n').map(function (s) { return s.trim() }).filter(Boolean)
      if (hints.length > 0) setPath(o, 'intervention.hint_templates', hints)
      // 词典: "term: weight" 每行一条
      var parseLex = function (text) {
        return String(text ?? '').split('\n').map(function (line) {
          var parts = line.trim().split(/[:：\s]+/)
          if (!parts[0]) return null
          var w = parseFloat(parts[1])
          return { term: parts[0], weight: Number.isFinite(w) ? Math.abs(w) : 1, match: 'word' }
        }).filter(Boolean)
      }
      // 防呆(2026-08-18 事故): 词典三栏全空时绝不写入覆盖——否则会把有效词典
      // 覆盖成空数组, 指纹匹配全灭, L1/L2/L3 从此不再触发。
      var lex = { positive: parseLex(values['override.features.lexicon.positive']), negative: parseLex(values['override.features.lexicon.negative']), neutral: parseLex(values['override.features.lexicon.neutral']) }
      if (lex.positive.length + lex.negative.length + lex.neutral.length > 0) {
        setPath(o, 'features.lexicon', lex)
      }
      // 工具列表
      var tools = String(values['override.intervention.bootstrap_tools'] ?? '').split(/[,，\s]+/).filter(Boolean)
      if (tools.length > 0) setPath(o, 'intervention.bootstrap_tools', tools)
      return o
    }

    function lexToLines(list) {
      return (list ?? []).map(function (e) { return e.term + ': ' + e.weight }).join('\n')
    }
    function arrToComma(arr) {
      return (arr ?? []).join(', ')
    }
    function triggerState(effective) {
      var trig = getPath(effective, 'threshold.trigger') ?? []
      var has = function (t) { return trig.some(function (r) { return r && r.type === t }) }
      var kRule = trig.find(function (r) { return r && r.type === 'sigma' })
      var pRule = trig.find(function (r) { return r && r.type === 'percentile' })
      return { mixed: has('mixed_band'), react: has('react_band'), sigma: has('sigma'), percentile: has('percentile'), floor: has('safety_floor'), k: kRule ? kRule.k : 1.5, p: pRule ? pRule.p : 5 }
    }

    // ── React 壳 ──
    function SettingsPage(props) {
      var ref = useRef(null)
      useEffect(function () {
        var el = ref.current
        if (!el) return
        injectSettingsStyle()
        loadSettings().then(function () { drawSettings(el) })
        return undefined
      }, [])
      return h('div', { ref: ref, className: 'am-settings' })
    }

    async function loadSettings() {
      setState.loaded = false
      setState.error = ''
      try {
        var res = await fetch('/api/anchored-monitor/settings', { cache: 'no-store' })
        var j = await res.json()
        if (j && j.ok) {
          setState.host = j.host || {}
          setState.effective = j.effective || null
          setState.monitorOnline = !!j.monitorOnline
          setState.loaded = true
        } else {
          setState.error = (j && j.error) || 'settings unavailable'
        }
      } catch (err) {
        setState.error = String(err && err.message ? err.message : err)
      }
    }

    function fieldHtml(f, value, trig) {
      var label = '<div class="am-set-label">' + esc(f.label) + '</div>'
      var hint = f.hint ? '<div class="am-set-hint">' + esc(f.hint) + '</div>' : ''
      var control = ''
      var val = value == null ? '' : value
      if (f.kind === 'toggle') {
        control = '<label class="am-set-toggle"><input type="checkbox" data-am="' + f.id + '"' + (val ? ' checked' : '') + '><span>' + esc(f.label) + '</span><span class="am-set-hint">' + esc(f.hint) + '</span></label>'
        return '<div class="am-set-field wide">' + control + '</div>'
      }
      if (f.kind === 'select') {
        control = '<select class="am-set-select" data-am="' + f.id + '">' + (f.options ?? []).map(function (o) {
          return '<option value="' + esc(o) + '"' + (String(val) === String(o) ? ' selected' : '') + '>' + esc(o) + '</option>'
        }).join('') + '</select>'
      } else if (f.kind === 'textarea') {
        control = '<textarea class="am-set-textarea" data-am="' + f.id + '" rows="4" spellcheck="false">' + esc(String(val)) + '</textarea>'
      } else if (f.kind === 'number') {
        var attrs = 'type="number"'
        if (f.min !== undefined) attrs += ' min="' + f.min + '"'
        if (f.max !== undefined) attrs += ' max="' + f.max + '"'
        if (f.step !== undefined) attrs += ' step="' + f.step + '"'
        control = '<input class="am-set-input" data-am="' + f.id + '" ' + attrs + ' value="' + esc(String(val)) + '">'
      } else {
        control = '<input class="am-set-input" data-am="' + f.id + '" type="text" value="' + esc(String(val)) + '">'
      }
      return '<div class="am-set-field">' + label + control + hint + '</div>'
    }

    function drawSettings(el) {
      if (!setState.loaded) {
        el.innerHTML = '<div class="am-set-status">' + esc(setState.error ? ('加载失败: ' + setState.error) : T('加载中…', 'Loading…')) + '</div>'
        return
      }
      var host = setState.host || {}
      var eff = setState.effective || {}
      var trig = triggerState(eff)
      // 预填值表
      var values = {}
      values['host.autoStart'] = host.autoStart
      values['host.enabled'] = host.enabled
      values['host.profile'] = host.profile || 'default'
      values['host.monitorUrl'] = host.monitorUrl || 'http://127.0.0.1:9301'
      values['override.dashboard.port'] = getPath(eff, 'dashboard.port') ?? 9301
      values['override.window.type'] = getPath(eff, 'window.type') ?? 'sliding'
      values['override.window.size'] = getPath(eff, 'window.size') ?? 20
      values['override.window.decay_lambda'] = getPath(eff, 'window.decay_lambda') ?? 0.05
      values['override.scoring.weights.alpha'] = getPath(eff, 'scoring.weights.alpha') ?? 2.0
      values['override.scoring.weights.beta'] = getPath(eff, 'scoring.weights.beta') ?? 0.5
      values['override.scoring.weights.gamma'] = getPath(eff, 'scoring.weights.gamma') ?? 1.5
      values['override.scoring.weights.epsilon'] = getPath(eff, 'scoring.weights.epsilon') ?? 1.0
      values['override.scoring.normalize'] = getPath(eff, 'scoring.normalize') !== false
      values['override.scoring.percentile_window'] = getPath(eff, 'scoring.percentile_window') ?? 200
      values['override.bands.spec_max'] = getPath(eff, 'bands.spec_max') ?? 0.2
      values['override.bands.react_min'] = getPath(eff, 'bands.react_min') ?? 0.5
      values['override.threshold.baseline_min_samples'] = getPath(eff, 'threshold.baseline_min_samples') ?? 10
      values['override.threshold.baseline_window'] = getPath(eff, 'threshold.baseline_window') ?? 50
      values['override.threshold.trend_window'] = getPath(eff, 'threshold.trend_window') ?? 5
      values['override.threshold.trend_slope_sigma'] = getPath(eff, 'threshold.trend_slope_sigma') ?? 0.25
      values['override.threshold.safety_floor'] = getPath(eff, 'threshold.safety_floor') ?? 10
      values['trig.mixed'] = trig.mixed
      values['trig.react'] = trig.react
      values['trig.sigma'] = trig.sigma
      values['trig.percentile'] = trig.percentile
      values['trig.floor'] = trig.floor
      values['override.threshold.sigmaK'] = trig.k
      values['override.threshold.percentileP'] = trig.p
      values['override.threshold.recovery.type'] = getPath(eff, 'threshold.recovery.type') ?? 'spec_band'
      values['override.threshold.recovery.k'] = getPath(eff, 'threshold.recovery.k') ?? 0.5
      values['override.intervention.cooldowns.L1_ms'] = getPath(eff, 'intervention.cooldowns.L1_ms') ?? 30000
      values['override.intervention.cooldowns.L2_ms'] = getPath(eff, 'intervention.cooldowns.L2_ms') ?? 120000
      values['override.intervention.cooldowns.L3_ms'] = getPath(eff, 'intervention.cooldowns.L3_ms') ?? 0
      values['override.intervention.max_L2_attempts'] = getPath(eff, 'intervention.max_L2_attempts') ?? 2
      values['override.intervention.hint_templates'] = (getPath(eff, 'intervention.hint_templates') ?? []).join('\n')
      values['override.intervention.bootstrap_tools'] = arrToComma(getPath(eff, 'intervention.bootstrap_tools') ?? ['bash', 'str_replace_editor'])
      values['override.intervention.bootstrap_system_prompt'] = getPath(eff, 'intervention.bootstrap_system_prompt') ?? 'You are a helpful software engineer assistant.'
      values['override.guards.cot.enabled'] = getPath(eff, 'guards.cot.enabled') !== false
      values['override.guards.cot.reasoning_stall_ms'] = getPath(eff, 'guards.cot.reasoning_stall_ms') ?? 15000
      values['override.guards.cot.text_active_window_ms'] = getPath(eff, 'guards.cot.text_active_window_ms') ?? 15000
      values['override.guards.cot.text_surge_window_ms'] = getPath(eff, 'guards.cot.text_surge_window_ms') ?? 30000
      values['override.guards.cot.text_surge_chars'] = getPath(eff, 'guards.cot.text_surge_chars') ?? 5000
      values['override.guards.cot.text_leak_ratio'] = getPath(eff, 'guards.cot.text_leak_ratio') ?? 0.6
      values['override.guards.cot.cooldown_ms'] = getPath(eff, 'guards.cot.cooldown_ms') ?? 30000
      // 内置研究默认词典: 监控离线(effective 缺失)时表单仍显示有效词典, 防止空保存清空指纹
      var DEFAULT_LEX = {
        positive: ['we: 2', "let's: 1.5", "we'll: 1.2", 'we need: 1.2', 'our: 0.8'],
        negative: ['let me: 3'],
        neutral: ['i will: 1', "i'll: 1", 'i need: 0.8', 'check: 0.4', 'verify: 0.4']
      }
      values['override.features.lexicon.positive'] = lexToLines(getPath(eff, 'features.lexicon.positive') ?? DEFAULT_LEX.positive)
      values['override.features.lexicon.negative'] = lexToLines(getPath(eff, 'features.lexicon.negative') ?? DEFAULT_LEX.negative)
      values['override.features.lexicon.neutral'] = lexToLines(getPath(eff, 'features.lexicon.neutral') ?? DEFAULT_LEX.neutral)
      values['override.experiment_log.path'] = getPath(eff, 'experiment_log.path') ?? './logs/experiment.jsonl'
      values['override.experiment_log.max_file_size_mb'] = getPath(eff, 'experiment_log.max_file_size_mb') ?? 50
      values['override.experiment_log.rotate'] = getPath(eff, 'experiment_log.rotate') !== false
      values['override.event_source.poll_interval_ms'] = getPath(eff, 'event_source.poll_interval_ms') ?? 50

      var status = '<div class="am-set-status"><i class="am-status-dot ' + (setState.monitorOnline ? 'on' : 'off') + '"></i>'
        + '<span style="flex:1">' + (setState.monitorOnline ? '<b>' + esc(T('监控在线', 'Monitor online')) + '</b>' : '<b>' + esc(T('监控离线', 'Monitor offline')) + '</b>')
        + (setState.monitorOnline && eff && eff.version ? ' · v' + esc(eff.version) : '')
        + ' · ' + esc(String(host.monitorUrl || '')) + '</span>'
        + '<button class="am-btn am-btn-ico" data-am="langbtn" title="' + esc(TEXTS.switchLang) + '">' + (langZh ? 'EN' : '中') + '</button></div>'

      var groupsHtml = fieldSpecs().map(function (g) {
        var fieldsHtml = '<div class="am-set-grid">' + g.fields.map(function (f) {
          return fieldHtml(f, values[f.path], trig)
        }).join('') + '</div>'
        return '<div class="am-set-group"><div class="am-set-group-head"><div class="am-set-group-title">' + esc(g.title) + '</div><div class="am-set-group-desc">' + esc(g.desc) + '</div></div>' + fieldsHtml + '</div>'
      }).join('')

      var skinHtml = '<div class="am-set-group"><div class="am-set-group-head"><div class="am-set-group-title">' + esc(TEXTS.skin) + '</div><div class="am-set-group-desc">' + esc(TEXTS.skinDesc) + '</div></div>'
        + '<div class="am-set-skins">'
        + '<div class="am-skin-card' + (state.skin === 'serious' ? ' active' : '') + '" data-skin="serious">'
        + '<div class="am-skin-card-head"><span class="am-skin-check">' + (state.skin === 'serious' ? '✓' : '') + '</span><span class="am-skin-title">' + esc(TEXTS.skinSerious) + '</span></div>'
        + '<div class="am-skin-desc">' + esc(TEXTS.skinSeriousDesc) + '</div>'
        + '<div class="am-skin-pv"><span class="pv-track"><i class="pv-fill" style="width:34%"></i></span><span class="pv-score">34.2</span></div>'
        + '</div>'
        + '<div class="am-skin-card' + (state.skin === 'meme' ? ' active' : '') + '" data-skin="meme">'
        + '<div class="am-skin-card-head"><span class="am-skin-check">' + (state.skin === 'meme' ? '✓' : '') + '</span><span class="am-skin-title">' + esc(TEXTS.skinMeme) + '</span></div>'
        + '<div class="am-skin-desc">' + esc(TEXTS.skinMemeDesc) + '</div>'
        + '<div class="am-skin-faces">'
        + [0, 1, 2, 3, 4, 5].map(function (i) { return '<img src="' + liangData(i) + '" alt="">' }).join('')
        + '<b>' + esc(TEXTS.memeTitle) + '</b>'
        + '</div>'
        + '</div>'
        + '</div></div>'

      el.innerHTML = status + skinHtml + groupsHtml
        + '<div class="am-set-savebar"><div class="am-set-savebar-note">' + esc(T('保存后自动重启监控进程使参数生效(会话内累计的窗口/基线会清零)。词典改动会改变指纹口径, 请按研究结论谨慎调整。', 'Saving restarts the monitor process (in-memory windows/baselines reset). Lexicon changes alter the fingerprint — tune carefully per the research.')) + '</div>'
        + '<button class="am-set-reset" data-am="reset" title="' + esc(TEXTS.resetBtnTitle) + '">' + esc(TEXTS.resetBtn) + '</button>'
        + '<button class="am-set-save" data-am="save">' + esc(T('保存设置', 'Save settings')) + '</button></div>'

      var saveBtn = el.querySelector('[data-am=save]')
      if (saveBtn) {
        saveBtn.addEventListener('click', function () {
          void saveSettings(el)
        })
      }
      var resetBtn = el.querySelector('[data-am=reset]')
      if (resetBtn) {
        resetBtn.addEventListener('click', function () {
          if (!window.confirm(TEXTS.resetConfirm)) return
          resetBtn.disabled = true
          fetch('/api/anchored-monitor/settings', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ reset: true })
          }).then(function (res) { return res.json() }).then(function (j) {
            if (j && j.ok) {
              toast(TEXTS.resetDone, true)
              setTimeout(function () { drawSettings(el) }, 400)
            } else {
              toast(TEXTS.resetFail + String((j && j.error) || 'unknown'), false)
              resetBtn.disabled = false
            }
          }).catch(function (err) {
            toast(TEXTS.resetFail + String(err && err.message ? err.message : err), false)
            resetBtn.disabled = false
          })
        })
      }
      var langBtn = el.querySelector('[data-am=langbtn]')
      if (langBtn) {
        langBtn.addEventListener('click', function () {
          toggleLang()
          setTimeout(function () { drawSettings(el) }, 30)
        })
      }
      el.querySelectorAll('[data-skin]').forEach(function (card) {
        card.addEventListener('click', function () {
          setSkin(card.getAttribute('data-skin'))
          el.querySelectorAll('[data-skin]').forEach(function (c) {
            c.classList.toggle('active', c === card)
          })
          el.querySelectorAll('[data-skin] .am-skin-check').forEach(function (chk, i) {
            chk.textContent = el.querySelectorAll('[data-skin]')[i] === card ? '✓' : ''
          })
        })
      })
    }

    function readValues() {
      var el = document.querySelector('.am-settings')
      var out = {}
      if (!el) return out
      el.querySelectorAll('[data-am]').forEach(function (node) {
        var id = node.getAttribute('data-am')
        if (id === 'save') return
        if (node.type === 'checkbox') out[id] = node.checked
        else if (node.type === 'number') out[id] = Number(node.value)
        else out[id] = node.value
      })
      return out
    }

    function toast(text, ok) {
      var t = document.createElement('div')
      t.className = 'am-set-toast ' + (ok ? 'ok' : 'err')
      t.textContent = text
      document.body.appendChild(t)
      setTimeout(function () { t.remove() }, 3600)
    }

    async function saveSettings() {
      var el = document.querySelector('.am-settings')
      var btn = el && el.querySelector('[data-am=save]')
      if (btn) btn.disabled = true
      try {
        var values = readValues()
        var overrides = collectOverrides(values)
        var hostPatch = {
          autoStart: values['host.autoStart'] !== false,
          enabled: values['host.enabled'] !== false,
          profile: values['host.profile'] || 'default',
          monitorUrl: values['host.monitorUrl'] || 'http://127.0.0.1:9301'
        }
        var res = await fetch('/api/anchored-monitor/settings', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ host: hostPatch, overrides: overrides })
        })
        var j = await res.json()
        if (j && j.ok) {
          setState.monitorOnline = !!j.monitorOnline
          toast(T('已保存' + (j.restarted ? '并重启监控进程' : '') + (j.monitorOnline ? ', 监控在线' : ' (监控未在线, 将自动拉起)'), 'Saved' + (j.restarted ? ' & monitor restarted' : '')), true)
        } else {
          toast(T('保存失败: ') + String((j && j.error) || 'unknown'), false)
        }
      } catch (err) {
        toast(T('保存失败: ') + String(err && err.message ? err.message : err), false)
      } finally {
        if (btn) btn.disabled = false
      }
    }

    return module.exports
  },
})

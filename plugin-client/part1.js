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
      startPolling()
      startUpdatePoll()
      console.log('[dsh-anchored-monitor] client ready: sidebar entry + liquid-glass overlay + rheostat bar + settings page')
    }

    exports.inject = ['slots', 'sessions']
    exports.apply = apply
    return module.exports
  },
})


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

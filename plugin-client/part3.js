
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
        + '<button class="am-btn am-iv-switch am-iv-on" data-am="ivtoggle" title="' + esc(TEXTS.ivSwitchTitle) + '"></button>'
        + '<button class="am-btn am-btn-ico" data-am="lang" title="' + esc(TEXTS.switchLang) + '">' + (langZh ? 'EN' : '中') + '</button>'
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
        ctx.strokeStyle = isDark() ? 'rgba(148,148,155,0.10)' : 'rgba(15,23,42,0.08)'
        ctx.beginPath()
        ctx.moveTo(pad.l, gy)
        ctx.lineTo(W - pad.r, gy)
        ctx.stroke()
        ctx.fillStyle = isDark() ? '#6b6b72' : '#98a2b3'
        ctx.fillText(String(g), pad.l - 6, gy + 3)
      }
      var stripW = Math.max(1, plotW / n)
      for (var i = 0; i < n; i++) {
        ctx.fillStyle = hexA(BAND_COLORS[hist[i].band] || BAND_COLORS.unknown, 0.10)
        ctx.fillRect(xOf(i) - stripW / 2, pad.t, stripW, plotH)
      }
      if (state.triggers && state.triggers.floor) {
        dashLine(ctx, yOf(state.thresholds.safetyFloor), pad, plotW, isDark() ? 'rgba(248,113,113,0.6)' : 'rgba(220,38,38,0.55)', 'floor ' + state.thresholds.safetyFloor)
      }
      if (state.triggers && state.triggers.sigma && snap.baseline && snap.baseline.mean != null) {
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
      var sel = panelEl.querySelector('[data-am=session]')
      if (sel) {
        sel.addEventListener('change', function () {
          state.selected = sel.value || null
          pollOnce()
        })
      }
    }

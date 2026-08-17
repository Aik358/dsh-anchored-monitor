
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
      '.am-bar{position:fixed;display:flex;align-items:center;gap:10px;height:38px;padding:0 12px;width:fit-content;max-width:min(400px,calc(100vw - 28px));border-radius:12px;',
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
      '.am-iv-switch{min-width:64px;justify-content:center;font-weight:600}',
      '.am-iv-on{color:#16a34a;border-color:rgba(22,163,74,0.5);background:rgba(22,163,74,0.08)}',
      '.am-iv-off{color:var(--am-muted)}',
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
      } else if (state.interventionsEnabled === false) {
        phaseEl.textContent = TEXTS.monitorOnly
        phaseEl.className = 'am-bar-phase am-phase-offline'
        barEl.title = TEXTS.title + ' · ' + TEXTS.monitorOnly
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


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
      values['host.profile'] = host.profile || 'demo'
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
        + '<button class="am-set-save" data-am="save">' + esc(T('保存设置', 'Save settings')) + '</button></div>'

      var saveBtn = el.querySelector('[data-am=save]')
      if (saveBtn) {
        saveBtn.addEventListener('click', function () {
          void saveSettings(el)
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
          profile: values['host.profile'] || 'demo',
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

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2026-08-19

### Added

- **Follow the active conversation** — the in-GUI panel now subscribes to the DSH shell's sessions service and automatically switches to the conversation that is currently open in the drawer/sidebar. No more staring at one fixed conversation: switch conversations in the GUI and the band chart / rheostat bar / interventions follow.
- **Followed-conversation ring** — the panel's switch button shows the monitored conversation id, ringed in blue when it follows the one you have open (amber = manual watch, red = the active conversation is not tracked yet); the floating bar's tooltip also carries the session id, so the panel stays findable no matter which conversation drawer you are in.
- **Not-tracked hint** — when the active conversation has produced no reasoning yet (so the monitor has no data for it), the panel says so instead of silently showing a stale session; it auto-follows the moment the first thinking block arrives.
- **Standalone dashboard follows recency** — web/app.js now defaults to the most recently active session (sorted by lastActivityAt) instead of the first registered one.
- **Zoomable chart with auto-follow-latest** — both the in-GUI panel and the standalone dashboard draw a bounded window of history instead of forever compressing the whole session into the same width; a **mini-map strip at the bottom of the chart** lets you drag to pan and wheel to zoom, and **double-click resumes auto-follow** so the view slides to the newest point as data arrives.
- **Header declutter** — the switch button + a status ring replace the separate status pill; the action buttons (✕ / ➖ / ↗) stay in place instead of being pushed off the default spot.
## [0.2.9] - 2026-08-18

### Added

- **CoT leak / reasoning-stall guards** — the monitor now also receives the **visible text channel** (text-delta pushed to /api/push-text), so it can watch for the two degradations the reasoning fingerprint alone can't see:
  - `text_leak` — thinking-style prose leaking into the visible body: fires when text characters in the surge window exceed `text_surge_chars` AND the text fingerprint ratio (`let me` / (we + let me)) is >= `text_leak_ratio`. This is the long-context signature where the model starts narrating its reasoning as regular reply text.
  - `streaming_stall` — the reasoning channel goes quiet (`reasoning_stall_ms`) while the session is still emitting text (`text_active_window_ms`) — the model keeps talking but has stopped sending real chain-of-thought.
  - Both are **alert-only** (new `guard_triggered` events + per-session `cot` counters in dashboard/snapshot); they never auto-intervene. Fully configurable under the new **CoT guard** settings group (enabled / stall / windows / char threshold / ratio / cooldown).
- **Intervention execution diagnostics** — the host now logs poll health + every executed intervention to the DSH log (30s-throttled poll summary: sessions seen, sessions with pending interventions, last error); `ackSignal` surfaces HTTP/network failures instead of silently swallowing. `executeSignal` acks `failed:...` when delivery via agents.followup did not happen instead of claiming `executed`.

### Changed

- **Default config profile is now `default` (production-safe)** instead of `demo`. The demo profile (1500/800ms cooldowns, 5 L2 attempts) was the default, causing very frequent interruptions; default.yaml uses L1=30000 / L2=120000 / L3=0 / attempts 2. `--profile default` is idempotent (config-loader skips the duplicate merge). The settings-page profile selector defaults to `default` and its description warns that `demo` is only for accelerated testing.

### Fixed

- `submitContinuation` returns whether the continuation was actually delivered; `executeSignal` reflects that in the ack status instead of always `executed`.

## [0.2.8] - 2026-08-18

### Added

- **Pairing clarification** in the READMEs: this monitor does **not** require a forced install of `xiaobright/dsh-anchored-standard` — it judges sessions purely by the `we / let's / let me` fingerprint, never by a preset's name. Any preset implementing the anchored-standard discipline (first-turn Minimal persona + collective "we" planning) works, including renamed derivatives like **梁神模式 / liangshen**. The L2 reset payload is self-contained (Minimal 46-char persona + `bash`/`str_replace_editor` shipped in this plugin's own config).
- **Model-specific intervention advice** in the READMEs + the in-panel hint: `ℹ Tip: keep interventions on only for DeepSeek V4 Pro 0813; turn them off (monitor-only) for other models.` (The on/off hint text was introduced in 0.2.7; 0.2.8 surfaces the same advice in the README).

## [0.2.7] - 2026-08-18

### Added

- **One-click Reset to defaults** in the settings page — clears every monitor override (window / lexicon / scoring / thresholds / cooldowns / log) and restarts the monitor with the profile's factory parameters, so you can never get stuck with settings you broke.
- **New positioning** in the READMEs: "don't touch a thing and it's a live gauge of how hard your model is thinking" — a visualization-first tool (thinking-efficiency / capability-intensity gauge) that only needs the whip when you want interventions, with the 「滑动变祖器」meme skin as the live *"梁系强度"* meter.

## [0.2.6] - 2026-08-18

### Fixed

- Face images really load now; the embedded base64 was missing the data URI prefix, so the faces never rendered. The assemble script now writes full data URIs (verified naturalWidth 96x96).
- Bubble perfectly centered over the knob: added translateX(-50%) and anchored it to the bar instead of the track, so it no longer slides 17px right nor overlaps the bar top.

### Changed

- Bigger meme bubble frame (52px, face 44px) with a larger tail.
- Test harness seeds welcomed=1 so mock screenshots are not covered by the welcome overlay.

## [0.2.5] - 2026-08-18

### Fixed

- **Face images now actually load** — the six Liang Wenfeng thumbs are **embedded in the client bundle as base64 data URIs** (generated by the assemble script from the liang PNGs), so the meme skin no longer depends on any network/host route; the settings-page meme card and the bar bubble always render.

### Changed

- **Meme skin redesign** — the face is no longer a fixed square on the left of the bar; it is now a small **speech-bubble floating above the intensity knob** (34px bubble + tail), sliding with the knob as thinking intensity moves, clamped to the track edges, pulsing with the band color.
- **Intervention hint** — the panel now shows a persistent tip row: keep interventions on **only for DeepSeek V4 Pro 0813**; turn them off (monitor-only) for other models. Same tip added to the settings Intervention group and the first-run welcome card.

## [0.2.4] - 2026-08-18

### Added

- **Meme skin「滑动变祖器 / Liang-o-meter」** — optional skin in the settings page (saved locally, applies instantly): the collapsed bar becomes a 28px square that flips through Liang Wenfeng faces — from *focused* (humble) to *slacking* (emperor) — as thinking intensity rises, pulsing with the band color; the host serves the PNGs from the loopback-only assets route (basename whitelist). Face assets from [Lichtspektrum/liang-intensity-calibrator](https://github.com/Lichtspektrum/liang-intensity-calibrator) (MIT, credited in the READMEs).

### Changed

- README: the zh/en language switch links moved to the top (right under the title), and the one-sentence hook is now **bilingual** directly below them (zh + en) — readable at a glance before scrolling.

## [0.2.3] - 2026-08-18

### Added

- **Auto update check** — the plugin checks `Aik358/dsh-anchored-monitor` on GitHub (12h TTL) and shows an update banner in the anchored-monitor popup with **Update / Dismiss** buttons when a newer version exists.
- **First-run welcome card** — new installs get a glass welcome card in the overlay explaining what the plugin is (one sentence: "a whip for DeepSeek V4 Pro"), how to use it (sidebar panel / rheostat bar / intervention switch) and where to configure.

### Changed

- Threshold lines are back on the chart: enabled rules stay solid, **disabled** rules render as faded dashed **reference** lines (labeled `· ref`) — you see the judgment boundaries without mistaking them for live triggers.
- README now opens with a one-sentence plain-language hook (zh + en): "it's a whip for DeepSeek V4 Pro — when the model falls from the focused We need / I will mode into the scattered let me mode, the whip cracks and pulls it back."

## [0.2.2] - 2026-08-18

### Fixed

- **Critical**: saving the settings page with empty lexicon textareas (e.g. while the monitor was offline and `effective` was missing) overwrote the fingerprint lexicon with empty arrays — no fingerprint matches, so L1/L2/L3 silently stopped firing. An all-empty lexicon now never overrides, and the form falls back to the built-in research defaults when the monitor is offline.
- Panel header no longer crowds at narrow widths: two-row layout (title + band/status chips on top; session select + action buttons below), title ellipsizes.

## [0.2.1] - 2026-08-18

### Fixed / Hardened

- **dismantle the four hidden hazards** from the llm/stream deadlock incident:
  - consumer-side defense: dsh-draw-gacha now iterates `await next()` (safe with any downstream listener);
  - explicit rule written into the listener + README (producer = plain function returning async generator; consumer = `for await (chunk of await next())`);
  - single-intervention-executor: `preset/` defaults `handleInterventions: false` — the host plugin owns L1/L2/L3, so mounting both can never double-register `agent/pre-step` / `system-prompt/assemble`.

## [0.2.0] - 2026-08-18

### Added

- **Zero-setup auto-start** — the host plugin spawns the monitor process when DSH starts (15s watchdog keeps it alive); no manual steps.
- **In-loop live interventions** — the host observes every session's reasoning, executes L1/L2/L3 automatically, and **auto-continues the task** (inbox `followup`) instead of stopping:
  - L1: suggestive hint injected as context (never imperative);
  - L2: **cancels the running turn and soft-restarts** — next request runs under the 46-char Minimal persona + `bash`/`str_replace_editor`;
  - L3: same soft-restart plus restart advice.
- **Live streaming ECG** — the host subscribes to `llm/stream` and pushes `reasoning-delta` chunks (1s throttle) so charts move while the model thinks (counts are additive; window aggregates are exact).
- **Intervention master switch** — panel-header toggle (runtime + persisted): off = monitor-only, no interventions.
- **Full settings page** — every parameter editable in the DSH settings page with explanations and a floating save bar (saving restarts the monitor).
- **zh/en language toggle** (panel header + settings), persisted.
- **Self-healing intervention execution** — the monitor snapshot is the single source of truth; `sent` interventions are executed and acked, recovering missed signals after restarts.

### Changed

- Dark theme now uses neutral grays (zinc `#18181b`) matching the shell background.
- The collapsed bar is a fixed-width rounded rectangle (320px, adaptive to viewport) — no more size jumping.
- Charts only draw threshold lines for **enabled** trigger rules (no misleading floor/μ lines).
- Faster heartbeats: 500ms polling, 1.5s ticker.

### Fixed

- **Critical**: the `llm/stream` waterfall listener was an async function wrapping the generator in a Promise, breaking every model request when another stream listener (`for await` over `next()`) sat earlier in the chain. The listener now returns the async generator directly.
- Missed intervention execution for signals older than the first poll (baseline-by-sequence bug).

## [0.1.0] - 2026-08-17

### Added

- **Independent monitor process** — event sources (JSONL log tail with zstd frame support / HTTP push), config-driven lexicon feature extraction, sliding & decay windows, weighted-ratio scoring with percentile normalization, dynamic baseline, trend & anomaly detection, three-band (spec/mixed/react) detection per router-standard *bandOf*, intervention decision state machine (L1 hint / L2 reset / L3 restart), per-level cooldowns, hysteresis recovery, JSONL experiment log with rotation.
- **HTTP + SSE server** (default 127.0.0.1:9301) — REST API, SSE event stream, static dashboard, offline replay & grid-search calibration scripts, synthetic demo generator & live feeder.
- **DSH Web plugin** (this package's `dsh.bundle` + `dsh.client` halves) — left-sidebar entry, liquid-glass overlay panel floating above the conversation (drag / resize / persist), collapsed rheostat-style bar showing thinking intensity + live log ticker, DeepSeek white/gray/blue palette with semantic warning colors, dark-theme support.
- **Host proxy layer** — `/api/anchored-monitor/*` loopback-only routes forwarding to the monitor process, config store at `~/.dsh/anchored-monitor.json`, agent-facing system-prompt section.
- **Harness agent preset** — `preset/` (AGENT-PLANE `anchored-monitor.mjs`) pushes reasoning blocks to the monitor and executes L1/L2/L3 interventions (persona reset to the 46-char Minimal sentence + `bash`/`str_replace_editor` bootstrap pair).
- Bilingual documentation and demo screenshots.

### Changed

- Detection signal is the three-band crossing (research-aligned); sigma/percentile/safety-floor statistical rules are opt-in.

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

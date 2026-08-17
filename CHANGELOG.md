# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

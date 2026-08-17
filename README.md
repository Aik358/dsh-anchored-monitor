# dsh-anchored-monitor

> Real-time chain-of-thought anchoring monitor & intervention for DeepSeek Harness.
> Watch the we / let's / let me fingerprint of every reasoning block, stay in the
> spec band, and pull the model back automatically when the trajectory drifts.

[![npm version](https://img.shields.io/npm/v/@a9i5k4/dsh-anchored-monitor)](https://www.npmjs.com/package/@a9i5k4/dsh-anchored-monitor)
[![GitHub stars](https://img.shields.io/github/stars/Aik358/dsh-anchored-monitor?style=social)](https://github.com/Aik358/dsh-anchored-monitor)
[![license](https://img.shields.io/npm/l/@a9i5k4/dsh-anchored-monitor)](LICENSE)
[![node](https://img.shields.io/badge/node-%3E%3D22.19-blue)](#requirements)

![dashboard](docs/dashboard.png)

**English** | [简体中文](README.zh-CN.md)

---

## Why this exists

DeepSeek V4 Pro conditions heavily on what the **first request** shows it. The
community measured the consequence: the official Minimal preset (46-character
persona + `bash`/`str_replace_editor`) anchors a collective "we" trajectory
and scores 99/96 on Project2, while the full Standard preset anchors an
actor-style "let me" trajectory and scores 91. Behavior is **path-committed**:
once anchored, expanding the tool catalog perturbs at most one reasoning block —
the mode never flips back on its own.

Anchored presets ([dsh-anchored-standard](https://github.com/xiaobright/dsh-anchored-standard))
solve the *bootstrap*. This plugin solves what happens **after** anchoring:
external factors (imperative hints, oversized injected context) can drag the
trajectory out of the spec band, and nothing detects or repairs that drift —
until now.

## What it does

- **Live fingerprinting** — every reasoning block is scored for the spec
  trajectory markers (`we`, `let's`, `we'll`, `we need`, …) versus the
  react marker (`let me`), over a sliding window.
- **Three-band model** — exactly the quantization measured by
  [dsh-router-standard](https://github.com/yjh051108/dsh-router-standard):
  `persona_ratio < 0.2 → spec`, `0.2–0.5 → mixed` (the unstable transition
  band), `≥ 0.5 → react`.
- **Tiered intervention** — automatic, cooldown-gated, with hysteresis recovery:

| Level | Trigger | Action |
|-------|---------|--------|
| L1 hint | entering the mixed band | injects a **suggestive** hint (never imperative — commands flip we→let me) |
| L2 reset | entering the react band | next request gets the 46-char Minimal persona + `bash`/`str_replace_editor` only; monitor window/baseline reset |
| L3 restart | L2 retries exhausted | recommends restarting the session |

- **Liquid-glass Web UI** — a sidebar entry opens a frosted-glass panel floating
  above the conversation (drag / resize / remembered). Collapsed, it becomes a
  **rheostat-style bar** showing thinking intensity as a slider position plus a
  rolling log ticker. DeepSeek white/gray/blue palette; dark mode uses neutral
  grays matching the shell. The bar is a fixed-width rounded rectangle (320px,
  viewport-adaptive) — no size jumping. **zh/en language toggle** in the panel
  header and settings.
- **Zero-setup auto-start** — the host plugin spawns the monitor process when
  DSH starts (15s watchdog keeps it alive). No manual steps.
- **Live streaming ECG** — the host subscribes to `llm/stream` and pushes
  `reasoning-delta` chunks (1s throttle), so the charts and the bar move
  while the model thinks — not just after each turn. Counts are additive, so
  window aggregates stay exact.
- **Intervention master switch** — a toggle in the panel header turns
  interventions on/off at runtime (persisted across restarts); off = monitor-only,
  no interruptions — handy when switching models.
- **Full settings page** — every parameter (window, lexicon, scoring weights,
  band boundaries, thresholds, cooldowns, hint templates, bootstrap pair, log
  rotation) is editable in the DSH settings page with explanations and a
  floating save bar; saving restarts the monitor to apply changes. Charts only
  draw threshold lines for **enabled** trigger rules.
- **In-loop interventions with auto-continue** — the host observes every
  session's reasoning, executes L1/L2/L3 automatically, and then **continues
  the task instead of stopping**:
  L1 injects a suggestive context hint (never imperative); L2 **cancels the
  running turn and soft-restarts** the conversation (the next request runs
  under the 46-char Minimal persona + `bash`/`str_replace_editor`); L3
  applies the same soft restart plus restart advice.
- **Experiment-first** — every lexicon entry, weight, threshold, window, band
  boundary and cooldown lives in YAML (`config/*.yaml`, validated against
  `config/schema.json`). JSONL experiment logs, offline replay and grid-search
  calibration scripts included.
- **Decoupled** — the monitor is an independent Node process; it never touches
  the model's context or compute.

## Requirements

- Node.js ≥ 22.19
- DeepSeek Harness 0.1.0-rc.5+ (for the web plugin & preset)

## Install

```bash
# 1) install the web plugin into your web profile (dsh CLI = pnpm forwarder)
dsh plugin --profile web add @a9i5k4/dsh-anchored-monitor

# 2) start the monitor process
npx anchored-monitor --profile demo

# 3) restart DeepSeek Harness (host bundle) and refresh the web GUI
```

You should now see **锚定监控 / Anchored Monitor** in the left sidebar footer.
Click it to open the glass panel; click the floating bar to expand/collapse.

To change the monitor address: edit `~/.dsh/anchored-monitor.json` or
`POST /api/anchored-monitor/config` with `{ "monitorUrl": "http://127.0.0.1:9301" }`.

## Quick demo

```bash
git clone https://github.com/Aik358/dsh-anchored-monitor.git
cd dsh-anchored-monitor
npm install && npm run build

npm run demo:generate                # 300 synthetic reasoning blocks
npm run dev -- --profile demo        # monitor + dashboard on :9301
npm run demo:feed                    # live-feed the blocks (watch L1→L2 cascade)
```

## Agent-side preset (optional)

Copy `preset/` into `~/.dsh/.agent-presets/anchored-monitor` to let the
*harness agent* push its own reasoning blocks to the monitor and execute the
L1/L2/L3 interventions inside the agent loop (pair it with an anchoring preset
such as dsh-anchored-standard for the first-round anchor).

## API

The monitor process exposes (default `http://127.0.0.1:9301`):

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/overview` | sessions + selected snapshot + tail events in one call |
| GET | `/api/sessions` | session summaries |
| GET | `/api/sessions/:id` | full snapshot (history / interventions / baseline) |
| GET | `/api/events?sessionId=&limit=` | tail of the experiment JSONL |
| POST | `/api/push` | push a reasoning block `{sessionId, text, sequence?, timestamp?}` |
| POST | `/api/sessions/:id/ack` | acknowledge an intervention |
| POST | `/api/sessions/:id/reset` | trigger a manual L2 reset |
| GET | `/api/stream` | SSE event stream |

The web plugin proxies these through `/api/anchored-monitor/*` (loopback-only).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run demo:generate` | generate a synthetic session JSONL (labelled, for calibration) |
| `npm run demo:feed` | live-feed blocks into a running monitor |
| `npm run replay -- --file x.jsonl` | offline replay with a summary report |
| `npm run calibrate -- --file x.jsonl` | grid-search window/weights/thresholds |
| `npm run preview:build` | snapshot the dashboard into a standalone HTML |

## Configuration

See [docs/experiment-params.md](docs/experiment-params.md) for the full
parameter reference. Everything is YAML — no hardcoded tuning.

## FAQ

**What happens after an intervention — does the conversation stop?**
No. Every intervention auto-continues the task: L1 injects a hint and the next
turn keeps going; L2 stops the running turn (soft restart) and immediately
re-enters context — the next request continues the task under the Minimal
persona + bootstrap pair; L3 does the same and adds restart advice.

**Why did the chart feel slow / frozen?**
Before 0.2.0, data only arrived once per finished turn. The host now streams
`reasoning-delta` chunks to the monitor every ~1s, so the curve moves while
the model thinks.

**How do I disable interventions?**
Use the panel-header switch (persisted), or set `intervention.enabled: false`
in the settings — monitoring continues, interventions stop.

**Does L2 truncate the model's context?**
No. L2 replaces only the next request's *persona section* with the 46-char
Minimal sentence and narrows the visible tool catalog to the bootstrap pair.
All conversation history is preserved; the monitor only resets its own
fingerprint statistics (invisible to the model). The plan-mode and all other
sections are kept, because dropping them causes re-exploration amnesia
(measured by dsh-router-standard).

**Why is the transition band treated as a warning?**
The mixed band (0.2–0.5) is the training-distribution gap: measured scores are
*lower* than either stable band. Entering it triggers the L1 hint; entering the
react band escalates.

**Is it safe to run?**
The monitor is read-only with respect to the model: it consumes reasoning text
and sends intervention signals. All HTTP routes are loopback-only. Reasoning
text may be sensitive — the experiment log is local by default; rotate/disable
it in `experiment_log`.

## Plugin author notes (read before extending)

**Streaming waterfall rule** — `llm/stream` is a stream-passthrough waterfall:
listeners earlier in the chain iterate the return value of the listeners after
them. Therefore:

1. **Producer side**: an `llm/stream` listener MUST be a plain function that
   returns an async generator. Never declare it `async` — the generator gets
   wrapped in a Promise and upstream `for await` consumers crash with
   `next(...) is not a function or its return value is not async iterable`.
2. **Consumer side**: always `for await (const chunk of await next())` —
   await first, then iterate; safe regardless of what downstream returns.
3. `agent/pre-step` / `system-prompt/assemble` are value-passing events;
   `async` + `await next()` is correct there.

A violation took down **every** model request with zero logged events — if all
sessions suddenly fail after a bundle reorder or a new plugin, audit the
`llm/stream` chain first.

**Single-intervention-executor rule** — L1/L2/L3 must have exactly one
executor. The Web plugin (host half) owns interventions and is the default;
the agent preset (`preset/`) ships with `handleInterventions: false` and only
pushes reasoning. Enabling both would double-register
`agent/pre-step` / `system-prompt/assemble` and fire L2 resets twice.

## Credits

Built on the measured results of these community projects (shallow-cloned in
`../references` for audit):

- [xiaobright/dsh-anchored-standard](https://github.com/xiaobright/dsh-anchored-standard) — two-phase anchor preset (bootstrap pair, promotion gate, post-promotion resident set)
- [ruler770525/dsh-anchored-flash](https://github.com/ruler770525/dsh-anchored-flash) — fingerprint counting (`we`/`let's`/`let me`) and the E1/E1.5 hint-wording experiments
- [yjh051108/dsh-router-standard](https://github.com/yjh051108/dsh-router-standard) — dual-attractor paper and the three-band quantization (`bandOf`)
- [KDB-Wind/dsh-minimal-anchored](https://github.com/KDB-Wind/dsh-minimal-anchored) — minimal-tool anchoring alternative
- [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) — the host framework this plugin extends

## License

[MIT](LICENSE) © 2026 Aik358

#!/usr/bin/env node
/**
 * anchored-monitor 监控进程入口
 * 用法: node dist/monitor/index.js [--config <path>] [--profile <name>] [--session <id[,id...]>] [--port <n>]
 */

import { pathToFileURL } from 'node:url'
import { resolveProjectRoot, resolveFromRoot } from '../shared/paths.js'
import { loadConfig } from '../shared/config-loader.js'
import { compileLexicon } from './feature/lexicon.js'
import { FeatureExtractor } from './feature/extractor.js'
import { createScoring } from './scoring/index.js'
import { ExperimentLogger } from './logger/experiment-log.js'
import { LogTailSource } from './event-source/log-tail.js'
import { IpcPushSource } from './event-source/ipc-push.js'
import { SessionManager } from './session-manager.js'
import { SignalSender } from './intervention/signal-sender.js'
import { startServer, type MonitorServer } from './server.js'
import type { MonitorEvent, InterventionSignal } from '../shared/types.js'

export interface MonitorRuntime {
  server: MonitorServer
  manager: SessionManager
  logger: ExperimentLogger
  logSource: LogTailSource
  pushSource: IpcPushSource
  url: string
  configHash: string
  profile: string
}

function parseArgs(argv: string[]): Record<string, string> {
  const args: Record<string, string> = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (!a.startsWith('--')) continue
    const key = a.slice(2)
    const next = argv[i + 1]
    if (next !== undefined && !next.startsWith('--')) {
      args[key] = next
      i += 1
    } else {
      args[key] = 'true'
    }
  }
  return args
}

export async function main(argv: string[]): Promise<MonitorRuntime> {
  const root = resolveProjectRoot(import.meta.url)
  const args = parseArgs(argv)

  const overrides: Record<string, unknown> = {}
  if (args.port !== undefined) overrides.dashboard = { port: Number(args.port) }
  if (args.host !== undefined) overrides.dashboard = { ...(overrides.dashboard as Record<string, unknown>), host: args.host }

  const loaded = await loadConfig({ root, configPath: args.config, profile: args.profile, overrides })
  const cfg = loaded.config

  const logger = new ExperimentLogger(cfg.experiment_log, resolveFromRoot(root, cfg.experiment_log.path))
  await logger.init()
  logger.write({ type: 'config_loaded', timestamp: Date.now(), configHash: loaded.hash, profile: loaded.profileName })

  const lexicon = compileLexicon(cfg.features.lexicon, cfg.features.regex_features)
  const extractor = new FeatureExtractor(lexicon)
  const scoring = createScoring(cfg.scoring)
  const sender = new SignalSender()

  let broadcast: ((event: MonitorEvent | InterventionSignal) => void) | null = null
  const manager = new SessionManager({
    config: cfg,
    configHash: loaded.hash,
    lexicon,
    extractor,
    scoring,
    emit: (event) => {
      logger.write(event)
      broadcast?.(event)
    },
    sender
  })

  const logSource = new LogTailSource(
    {
      pattern: cfg.session_id_pattern,
      pollIntervalMs: cfg.event_source.poll_interval_ms,
      startFrom: cfg.event_source.start_from,
      reasoningFields: cfg.event_source.log_event_reasoning_fields,
      onError: (sessionId, message) => console.error(`[log-tail:${sessionId}] ${message}`)
    },
    manager
  )
  const pushSource = new IpcPushSource(manager)
  if (cfg.event_source.type === 'log_tail') await logSource.start()

  const server = await startServer({
    config: cfg,
    configHash: loaded.hash,
    manager,
    root,
    logPath: resolveFromRoot(root, cfg.experiment_log.path),
    registerSource: (sessionId, logPath) => logSource.registerSession(sessionId, logPath ? { logPath } : undefined),
    onLog: (m) => console.log(m)
  })
  broadcast = server.broadcast

  if (args.session) {
    for (const id of args.session.split(',').map((s) => s.trim()).filter(Boolean)) {
      manager.registerSession(id, 'log_tail')
      if (cfg.event_source.type === 'log_tail') await logSource.registerSession(id)
      console.log(`[sessions] 已注册: ${id}`)
    }
  }

  console.log(`anchored-monitor v${cfg.version} (config: ${loaded.sources.join(' + ')})`)
  console.log(`profile: ${loaded.profileName} | configHash: ${loaded.hash}`)
  console.log(`dashboard: ${server.url}  (SSE: ${server.url}/api/stream)`)
  console.log(`experiment log: ${resolveFromRoot(root, cfg.experiment_log.path)}`)
  console.log('按 Ctrl+C 退出')

  const shutdown = () => {
    console.log('\n[shutdown] 停止监控进程...')
    void (async () => {
      await logSource.stop()
      await logger.close()
      server.server.close(() => process.exit(0))
      setTimeout(() => process.exit(0), 500).unref()
    })()
  }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)

  return {
    server,
    manager,
    logger,
    logSource,
    pushSource,
    url: server.url,
    configHash: loaded.hash,
    profile: loaded.profileName
  }
}

// 直接运行时启动(被 import 时不启动)
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch((err) => {
    console.error('[fatal]', err)
    process.exit(1)
  })
}

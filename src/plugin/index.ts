/**
 * AnchoredMonitorPlugin — 插件宿主侧门面: 推送 reasoning + 订阅干预信号并执行
 * 非 harness 宿主(测试/demo)用任意 HarnessAdapter 实现即可
 */

import { MonitorClient } from './ipc-client.js'
import { PushSource } from './push-source.js'
import { InterventionExecutor, type HarnessAdapter } from './intervention-executor.js'

export interface AnchoredMonitorPluginOptions {
  baseUrl: string
  adapter: HarnessAdapter
  reasoningFields?: string[]
  /** 只订阅指定会话的干预信号; 缺省全部 */
  sessionId?: string
}

const DEFAULT_REASONING_FIELDS = ['reasoning', 'reasoning_content', 'reasoningText']

export class AnchoredMonitorPlugin {
  readonly client: MonitorClient
  readonly pushSource: PushSource
  private readonly executor: InterventionExecutor
  private unsubscribe: (() => void) | null = null
  private registered = new Set<string>()

  constructor(private readonly opts: AnchoredMonitorPluginOptions) {
    this.client = new MonitorClient(opts.baseUrl)
    this.pushSource = new PushSource(this.client, opts.reasoningFields ?? DEFAULT_REASONING_FIELDS)
    this.executor = new InterventionExecutor(opts.adapter)
  }

  async ensureRegistered(sessionId: string): Promise<void> {
    if (this.registered.has(sessionId)) return
    this.registered.add(sessionId)
    await this.client.register(sessionId)
  }

  async handleSessionEvent(sessionId: string, event: unknown): Promise<void> {
    await this.ensureRegistered(sessionId)
    await this.pushSource.handleSessionEvent(sessionId, event)
  }

  /** 订阅干预信号; 收到信号先执行再回 ack */
  start(): () => void {
    if (this.unsubscribe) return this.unsubscribe
    this.unsubscribe = this.client.subscribeInterventions(this.opts.sessionId ?? null, async (signal) => {
      const status = await this.executor.execute(signal)
      try {
        await this.client.ack(signal.sessionId, signal.level, status)
      } catch {
        // ack 失败不重试: 监控进程日志已有 intervention_triggered
      }
    })
    return this.unsubscribe
  }

  stop(): void {
    this.unsubscribe?.()
    this.unsubscribe = null
  }
}

export type { HarnessAdapter }

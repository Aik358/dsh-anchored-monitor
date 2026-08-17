/**
 * PushSource — 把 harness 持久事件记录中的 reasoning 块推送到监控进程
 * 事件行格式来自 deepseek-harness 持久会话日志(assistant/message → content[].reasoning)
 */

import type { MonitorClient } from './ipc-client.js'
import { extractReasoningFromRecord } from '../monitor/event-source/log-tail.js'

export class PushSource {
  private seqBySession = new Map<string, number>()

  constructor(
    private readonly client: MonitorClient,
    private readonly reasoningFields: string[]
  ) {}

  /** 处理一条会话事件; 不含 reasoning 时返回 false */
  async handleSessionEvent(sessionId: string, event: unknown): Promise<boolean> {
    const text = extractReasoningFromRecord(event, this.reasoningFields)
    if (text === null || text.length === 0) return false
    const seq = (this.seqBySession.get(sessionId) ?? 0) + 1
    this.seqBySession.set(sessionId, seq)
    await this.client.push(sessionId, text, seq, Date.now())
    return true
  }
}

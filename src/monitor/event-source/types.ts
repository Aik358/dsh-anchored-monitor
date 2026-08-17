/**
 * 事件源适配器公共接口
 */

import type { ReasoningBlock } from '../../shared/types.js'

export interface EventSink {
  ingest(block: ReasoningBlock): Promise<void> | void
}

export interface EventSourceAdapter {
  start(): Promise<void>
  stop(): Promise<void>
  registerSession(sessionId: string, opts?: { logPath?: string }): Promise<void>
}

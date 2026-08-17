/**
 * IpcPushSource: 插件宿主侧经 HTTP POST /api/push 主动推送 reasoning 块
 * (本适配器只是 EventSink 的直通包装, 推送入口在 HTTP 服务)
 */

import type { ReasoningBlock } from '../../shared/types.js'
import type { EventSink, EventSourceAdapter } from './types.js'

export class IpcPushSource implements EventSourceAdapter {
  constructor(private readonly sink: EventSink) {}

  async start(): Promise<void> {}

  async stop(): Promise<void> {}

  async registerSession(_sessionId: string): Promise<void> {
    // 会话在首次 push 时自动创建
  }

  push(block: ReasoningBlock): void {
    void this.sink.ingest(block)
  }
}

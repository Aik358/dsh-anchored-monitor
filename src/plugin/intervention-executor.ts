/**
 * InterventionExecutor — 在插件宿主侧执行 L1/L2/L3 干预
 * 宿主差异由 HarnessAdapter 抽象; 措辞纪律: 注入文本必须中性/建议式
 */

import type { InterventionSignal } from '../shared/types.js'

export interface HarnessAdapter {
  /** L1: 把中性/建议式提示注入下一轮用户消息末尾, 不改变工具集 */
  appendHint(sessionId: string, hintText: string): Promise<void> | void
  /** L2: 清空当前会话上下文; persona 切回 Minimal 46 字符句; 工具集切回 bootstrap 对 */
  resetContext(sessionId: string, systemPrompt: string, tools: string[]): Promise<void> | void
  /** L3: 终止当前会话, 向用户展示建议重启的消息 */
  restartSession(sessionId: string, message: string): Promise<void> | void
}

export class InterventionExecutor {
  constructor(private readonly adapter: HarnessAdapter) {}

  async execute(signal: InterventionSignal): Promise<'executed' | 'failed'> {
    try {
      if (signal.level === 'L1') {
        await this.adapter.appendHint(signal.sessionId, signal.payload.hintText ?? '')
      } else if (signal.level === 'L2') {
        await this.adapter.resetContext(
          signal.sessionId,
          signal.payload.reset?.systemPrompt ?? '',
          signal.payload.reset?.tools ?? []
        )
      } else {
        await this.adapter.restartSession(signal.sessionId, signal.payload.message ?? signal.reason)
      }
      return 'executed'
    } catch (err) {
      console.error('[intervention-executor] failed:', err instanceof Error ? err.message : err)
      return 'failed'
    }
  }
}

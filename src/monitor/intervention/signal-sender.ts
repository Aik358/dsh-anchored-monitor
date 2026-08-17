/**
 * 信号发送器: 把干预信号广播给所有已注册目标(SSE 客户端 / 插件 webhook)
 */

import type { InterventionSignal } from '../../shared/types.js'

export interface SignalTarget {
  sendSignal(signal: InterventionSignal): void | Promise<void>
}

export class SignalSender {
  private targets: SignalTarget[] = []

  addTarget(target: SignalTarget): () => void {
    this.targets.push(target)
    return () => {
      const i = this.targets.indexOf(target)
      if (i >= 0) this.targets.splice(i, 1)
    }
  }

  async send(signal: InterventionSignal): Promise<void> {
    for (const target of [...this.targets]) {
      try {
        await target.sendSignal(signal)
      } catch (err) {
        // 单个目标失败不阻塞其余目标
        console.error('[signal-sender] target failed:', err instanceof Error ? err.message : err)
      }
    }
  }
}

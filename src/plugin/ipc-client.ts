/**
 * MonitorClient — 插件宿主侧 HTTP 客户端(注册/推送/ack/SSE 订阅)
 * 基于全局 fetch + EventSource(Node >= 22.4 内置)
 */

import type { InterventionSignal } from '../shared/types.js'

export interface StreamEvent {
  type: string
  sessionId?: string
  [key: string]: unknown
}

export class MonitorClient {
  constructor(private readonly baseUrl: string) {
    if (!/^https?:\/\//.test(baseUrl)) throw new Error(`monitorUrl 必须是 http(s) URL: ${baseUrl}`)
  }

  private async post(path: string, body: unknown): Promise<unknown> {
    const res = await fetch(this.baseUrl + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    if (!res.ok) throw new Error(`POST ${path} → HTTP ${res.status}`)
    return (await res.json()) as unknown
  }

  async register(sessionId: string, logPath?: string): Promise<unknown> {
    return this.post(`/api/sessions/${encodeURIComponent(sessionId)}/register`, {
      type: 'register',
      sessionId,
      logPath,
      timestamp: Date.now()
    })
  }

  async push(sessionId: string, text: string, sequence?: number, timestamp?: number): Promise<unknown> {
    return this.post('/api/push', {
      type: 'reasoning_block',
      sessionId,
      text,
      sequence,
      timestamp: timestamp ?? Date.now()
    })
  }

  async ack(sessionId: string, level: 'L1' | 'L2' | 'L3', status: string): Promise<unknown> {
    return this.post(`/api/sessions/${encodeURIComponent(sessionId)}/ack`, {
      type: 'ack',
      sessionId,
      level,
      status,
      timestamp: Date.now()
    })
  }

  /** 订阅 SSE 事件流; sessionId 为 null 时订阅全部会话. 返回取消函数 */
  subscribe(sessionId: string | null, onEvent: (event: StreamEvent) => void): () => void {
    const query = sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : ''
    const es = new EventSource(this.baseUrl + '/api/stream' + query)
    es.onmessage = (ev) => {
      try {
        onEvent(JSON.parse(ev.data as string) as StreamEvent)
      } catch {
        // 忽略无法解析的消息
      }
    }
    return () => es.close()
  }

  /** 订阅干预信号(过滤后的便捷封装) */
  subscribeInterventions(
    sessionId: string | null,
    onSignal: (signal: InterventionSignal) => void
  ): () => void {
    return this.subscribe(sessionId, (event) => {
      if (event.type === 'intervention_triggered') {
        onSignal(event as unknown as InterventionSignal)
      }
    })
  }
}

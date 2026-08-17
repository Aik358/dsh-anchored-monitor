/**
 * IPC 消息协议常量与消息类型
 * 监控进程 ↔ 插件宿主侧 通过 HTTP + SSE 通信
 */

import type { InterventionLevel } from './types.js'

export const IPC = {
  /** 监控 → 插件: 干预信号(SSE 推送, 也支持 /api/interventions 查询) */
  MSG_INTERVENTION: 'intervention',
  /** 插件 → 监控: 干预执行确认 POST /api/sessions/:id/ack */
  MSG_ACK: 'ack',
  /** 插件 → 监控: reasoning 块推送 POST /api/push */
  MSG_PUSH_BLOCK: 'reasoning_block',
  /** 插件 → 监控: 会话注册 POST /api/sessions/:id/register */
  MSG_REGISTER: 'register'
} as const

export interface AckMessage {
  type: typeof IPC.MSG_ACK
  sessionId: string
  level: Exclude<InterventionLevel, 'none'>
  status: string
  timestamp: number
}

export interface PushMessage {
  type: typeof IPC.MSG_PUSH_BLOCK
  sessionId: string
  sequence?: number
  text: string
  timestamp?: number
}

export interface RegisterMessage {
  type: typeof IPC.MSG_REGISTER
  sessionId: string
  logPath?: string
  timestamp: number
}

export type PluginToMonitorMessage = AckMessage | PushMessage | RegisterMessage

/**
 * 冷却管理: 每个干预级别独立冷却, 冷却期内不重复触发同级别
 */

import type { CooldownsConfig } from '../../shared/types.js'

export type Level = 'L1' | 'L2' | 'L3'

export class CooldownManager {
  private lastSent: Partial<Record<Level, number>> = {}

  constructor(private readonly cooldowns: CooldownsConfig) {}

  remaining(level: Level, now: number): number {
    const last = this.lastSent[level]
    if (last === undefined) return 0
    return Math.max(0, this.cooldowns[`${level}_ms`] - (now - last))
  }

  isReady(level: Level, now: number): boolean {
    return this.remaining(level, now) <= 0
  }

  markSent(level: Level, now: number): void {
    this.lastSent[level] = now
  }

  /** 各级别剩余冷却毫秒(供仪表盘展示) */
  snapshot(now: number): { L1: number; L2: number; L3: number } {
    return {
      L1: this.remaining('L1', now),
      L2: this.remaining('L2', now),
      L3: this.remaining('L3', now)
    }
  }
}

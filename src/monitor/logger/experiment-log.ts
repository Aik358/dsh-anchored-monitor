/**
 * 实验日志: JSONL 事件流 + 大小轮转
 */

import { createWriteStream, existsSync, renameSync, statSync, type WriteStream } from 'node:fs'
import type { ExperimentLogConfig, MonitorEvent } from '../../shared/types.js'
import { ensureDir } from '../../shared/paths.js'

export class ExperimentLogger {
  private stream: WriteStream | null = null
  private bytesWritten = 0
  private readonly path: string

  constructor(
    private readonly config: ExperimentLogConfig,
    resolvedPath: string
  ) {
    this.path = resolvedPath
  }

  async init(): Promise<void> {
    ensureDir(this.path)
    if (existsSync(this.path)) {
      try {
        this.bytesWritten = statSync(this.path).size
      } catch {
        this.bytesWritten = 0
      }
    }
    this.stream = createWriteStream(this.path, { flags: 'a' })
  }

  write(event: MonitorEvent): void {
    if (!this.stream) return
    const line = JSON.stringify(event) + '\n'
    this.bytesWritten += Buffer.byteLength(line)
    this.rotateIfNeeded()
    this.stream.write(line)
  }

  private rotateIfNeeded(): void {
    if (!this.config.rotate || !this.stream) return
    if (this.bytesWritten < this.config.max_file_size_mb * 1024 * 1024) return
    const old = this.stream
    this.stream = null
    old.end(() => {
      try {
        renameSync(this.path, this.path + '.' + Date.now())
      } catch {
        // 轮转失败不致命: 日志继续追加
      }
      this.stream = createWriteStream(this.path, { flags: 'a' })
      this.bytesWritten = 0
    })
  }

  async close(): Promise<void> {
    const s = this.stream
    this.stream = null
    if (!s) return
    await new Promise<void>((resolve) => s.end(() => resolve()))
  }
}

/**
 * LogTailSource: 监听 harness 会话日志文件的新增记录, 解析出 reasoning 块
 *
 * 支持两种日志:
 *  - 纯文本 JSONL(如 ~/.dsh/sessions/{sessionId}/events.jsonl), 增量读取
 *  - zstd 压缩日志(harness 默认 session.jsonl.zstd, 帧魔数 0x28b52ffd),
 *    按文件大小变化触发整文件解压(会话级小文件, 开销可控)
 *
 * 事件行格式(来自 harness 持久会话日志):
 *  { "type": "assistant/message", "data": { "message": { "content": [
 *      { "type": "reasoning", "text": "..." }, { "type": "text", "text": "..." } ] } } }
 */

import { existsSync, statSync, readFileSync, writeFileSync, watch, type FSWatcher } from 'node:fs'
import { zstdDecompressSync } from 'node:zlib'
import type { ReasoningBlock } from '../../shared/types.js'
import { expandHome, ensureDir } from '../../shared/paths.js'
import type { EventSink, EventSourceAdapter } from './types.js'

const ZSTD_MAGIC = Buffer.from([0x28, 0xb5, 0x2f, 0xfd])

export interface LogTailOptions {
  /** 日志路径模板, {sessionId} 会被替换 */
  pattern: string
  pollIntervalMs: number
  startFrom: 'beginning' | 'end'
  reasoningFields: string[]
  onError?: (sessionId: string, message: string) => void
}

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** 从一条持久事件记录中提取 reasoning 文本(宽容解析) */
export function extractReasoningFromRecord(record: unknown, fields: string[]): string | null {
  if (!isObj(record)) return null
  // 直接推送格式
  if (record.type === 'reasoning_block' && typeof record.text === 'string' && record.text.length > 0) {
    return record.text
  }
  // 候选字段(配置化)
  for (const f of fields) {
    const v = (record as Record<string, unknown>)[f]
    if (typeof v === 'string' && v.length > 0) return v
  }
  // harness 标准形状: data.message.content[] 中 type 为 reasoning/thinking 的条目
  const data = record.data
  const message = isObj(data) && isObj(data.message) ? data.message : isObj(data) ? data : null
  if (message && Array.isArray(message.content)) {
    const parts: string[] = []
    for (const item of message.content) {
      if (isObj(item) && typeof item.type === 'string' && /reason|think/i.test(item.type) && typeof item.text === 'string') {
        parts.push(item.text)
      } else if (isObj(item)) {
        const nested = extractReasoningFromRecord(item, fields)
        if (nested !== null) parts.push(nested)
      }
    }
    if (parts.length > 0) return parts.join('\n')
  }
  if (message && isObj(message) && message !== data) {
    const nested = extractReasoningFromRecord(message, fields)
    if (nested !== null) return nested
  }
  return null
}

/** 解压 zstd 帧序列(harness session.jsonl.zstd 格式) */
export function decompressZstdFrames(buf: Buffer): string {
  const frames: Buffer[] = []
  let i = 0
  while (i < buf.length - 4) {
    if (buf.subarray(i, i + 4).equals(ZSTD_MAGIC)) {
      let j = i + 4
      let next = buf.indexOf(ZSTD_MAGIC, j)
      if (next === -1) next = buf.length
      frames.push(buf.subarray(i, next))
      i = next
    } else {
      i += 1
    }
  }
  return frames.map((f) => zstdDecompressSync(f).toString('utf8')).join('')
}

class LogTailer {
  private pos = 0
  private buffer = ''
  private seq = 0
  private processedZstdLines = 0
  private lastSize = -1
  private timer: NodeJS.Timeout | null = null
  private watcher: FSWatcher | null = null
  private polling = false
  private readonly isZstd: boolean

  constructor(
    private readonly path: string,
    private readonly sessionId: string,
    private readonly opts: LogTailOptions,
    private readonly sink: EventSink
  ) {
    this.isZstd = path.endsWith('.zstd')
  }

  async start(): Promise<void> {
    if (!existsSync(this.path)) {
      ensureDir(this.path)
      writeFileSync(this.path, '')
    }
    const size = statSync(this.path).size
    if (this.opts.startFrom === 'end') {
      this.lastSize = size
      this.pos = size
    } else {
      await this.poll()
    }
    this.timer = setInterval(() => void this.poll(), this.opts.pollIntervalMs)
    try {
      this.watcher = watch(this.path, () => void this.poll())
    } catch {
      // watch 失败仅靠轮询
    }
  }

  async stop(): Promise<void> {
    if (this.timer) clearInterval(this.timer)
    this.watcher?.close()
  }

  private async poll(): Promise<void> {
    if (this.polling) return
    this.polling = true
    try {
      if (this.isZstd) await this.pollZstd()
      else await this.pollPlain()
    } catch (err) {
      this.opts.onError?.(this.sessionId, err instanceof Error ? err.message : String(err))
    } finally {
      this.polling = false
    }
  }

  private async pollPlain(): Promise<void> {
    const size = statSync(this.path).size
    if (size <= this.pos) return
    const buf = Buffer.alloc(size - this.pos)
    // 简单可靠的增量读取: 打开文件流读 [pos, size)
    const { openSync, readSync, closeSync } = await import('node:fs')
    const fd = openSync(this.path, 'r')
    try {
      readSync(fd, buf, 0, buf.length, this.pos)
    } finally {
      closeSync(fd)
    }
    this.pos = size
    this.buffer += buf.toString('utf8')
    this.drainBuffer()
  }

  private drainBuffer(): void {
    const lines = this.buffer.split('\n')
    this.buffer = lines.pop() ?? ''
    for (const line of lines) this.processLine(line)
  }

  private async pollZstd(): Promise<void> {
    const size = statSync(this.path).size
    if (size === this.lastSize) return
    this.lastSize = size
    const text = decompressZstdFrames(readFileSync(this.path))
    const lines = text.split('\n').filter((l) => l.trim().length > 0)
    const fresh = lines.slice(this.processedZstdLines)
    this.processedZstdLines = lines.length
    for (const line of fresh) this.processLine(line)
  }

  private processLine(line: string): void {
    let record: unknown = null
    try {
      record = JSON.parse(line)
    } catch {
      return // 非 JSON 行, 跳过
    }
    const text = extractReasoningFromRecord(record, this.opts.reasoningFields)
    if (text === null || text.length === 0) return
    this.seq += 1
    const timestamp = isObj(record) && typeof record.timestamp === 'number' ? record.timestamp : Date.now()
    const block: ReasoningBlock = {
      sessionId: this.sessionId,
      timestamp,
      sequence: this.seq,
      text,
      source: 'log'
    }
    void this.sink.ingest(block)
  }
}

export class LogTailSource implements EventSourceAdapter {
  private tailers = new Map<string, LogTailer>()

  constructor(
    private readonly opts: LogTailOptions,
    private readonly sink: EventSink
  ) {}

  async start(): Promise<void> {}

  async stop(): Promise<void> {
    for (const t of this.tailers.values()) await t.stop()
    this.tailers.clear()
  }

  async registerSession(sessionId: string, opts?: { logPath?: string }): Promise<void> {
    if (this.tailers.has(sessionId)) return
    const template = opts?.logPath ?? this.opts.pattern
    const path = expandHome(template.replaceAll('{sessionId}', sessionId))
    const tailer = new LogTailer(path, sessionId, this.opts, this.sink)
    await tailer.start()
    this.tailers.set(sessionId, tailer)
  }
}

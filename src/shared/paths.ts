/**
 * 路径工具: 项目根定位 / ~ 展开 / 目录创建
 * 兼容 dist/ 与 src/ 两种运行位置
 */

import { createHash } from 'node:crypto'
import { existsSync, mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { homedir } from 'node:os'
import { fileURLToPath } from 'node:url'

let cachedRoot: string | null = null

/** 从 import.meta.url 向上查找 package.json, 定位项目根 */
export function resolveProjectRoot(fromUrl: string): string {
  if (cachedRoot) return cachedRoot
  let dir = dirname(fileURLToPath(fromUrl))
  for (let i = 0; i < 10; i++) {
    if (existsSync(join(dir, 'package.json'))) {
      cachedRoot = dir
      return dir
    }
    const parent = dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  throw new Error('无法定位项目根目录(未找到 package.json)')
}

export function expandHome(p: string): string {
  if (p === '~') return homedir()
  if (p.startsWith('~/') || p.startsWith('~\\')) {
    return join(homedir(), p.slice(2))
  }
  return p
}

/** 相对路径以项目根为基准解析(除非已是绝对路径) */
export function resolveFromRoot(root: string, p: string): string {
  const expanded = expandHome(p)
  return resolve(expanded) === expanded ? expanded : resolve(root, expanded)
}

export function ensureDir(p: string): void {
  mkdirSync(dirname(p), { recursive: true })
}

export function configHash(config: unknown): string {
  const json = JSON.stringify(config)
  return createHash('sha256').update(json).digest('hex').slice(0, 12)
}

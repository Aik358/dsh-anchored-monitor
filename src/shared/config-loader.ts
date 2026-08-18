/**
 * 配置加载与 JSON Schema 校验 + 深合并(支持 profile 叠加与 CLI 覆盖)
 */

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { Ajv } from 'ajv'
import { parse as parseYaml } from 'yaml'
import type { MonitorConfig } from './types.js'
import { configHash, resolveFromRoot } from './paths.js'

export interface ConfigLoadOptions {
  root: string
  /** 主配置文件路径(绝对或相对项目根); 缺省 config/default.yaml */
  configPath?: string
  /** profile 名(不带 .yaml), 位于 config/ 下, 深合并到主配置之上 */
  profile?: string
  /** 运行时覆盖(如 --port), 优先级最高 */
  overrides?: Record<string, unknown>
}

export interface LoadedConfig {
  config: MonitorConfig
  hash: string
  profileName: string
  sources: string[]
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** 深合并: 对象递归合并, 数组整体替换 */
export function deepMerge<T>(base: T, patch: unknown): T {
  if (!isPlainObject(base) || !isPlainObject(patch)) {
    return (patch === undefined ? base : patch) as T
  }
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) }
  for (const [k, v] of Object.entries(patch)) {
    out[k] = isPlainObject(v) && isPlainObject(out[k]) ? deepMerge(out[k], v) : v
  }
  return out as T
}

export async function loadConfig(opts: ConfigLoadOptions): Promise<LoadedConfig> {
  const schemaRaw = await readFile(join(opts.root, 'config', 'schema.json'), 'utf8')
  const schema = JSON.parse(schemaRaw) as Record<string, unknown>

  const cfgPath = opts.configPath
    ? resolveFromRoot(opts.root, opts.configPath)
    : join(opts.root, 'config', 'default.yaml')
  const sources: string[] = [cfgPath]

  const baseRaw = await readFile(cfgPath, 'utf8')
  let config = parseYaml(baseRaw) as Record<string, unknown>
  let profileName = 'default'

  if (opts.profile) {
    profileName = opts.profile.replace(/\.yaml$/i, '')
    // 'default' 就是主配置本身(不传 --profile 也是它), 跳过重复合并, 幂等
    if (profileName !== 'default') {
      const profPath = join(opts.root, 'config', profileName + '.yaml')
      const profRaw = await readFile(profPath, 'utf8')
      config = deepMerge(config, parseYaml(profRaw))
      sources.push(profPath)
    }
  }
  if (opts.overrides) config = deepMerge(config, opts.overrides)

  const ajv = new Ajv({ allErrors: true, strict: false })
  const validate = ajv.compile(schema)
  if (!validate(config)) {
    const msgs = (validate.errors ?? [])
      .map((e) => `${e.instancePath || '/'} ${e.message ?? 'invalid'}`)
      .join('; ')
    throw new Error(`配置校验失败(${sources.join(', ')}): ${msgs}`)
  }

  const monitorConfig = config as unknown as MonitorConfig
  return { config: monitorConfig, hash: configHash(monitorConfig), profileName, sources }
}

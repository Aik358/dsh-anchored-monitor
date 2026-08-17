/**
 * @a9i5k4/dsh-anchored-monitor — host half (零运行时依赖, 仅 node 内置模块)。
 *
 * 职责:
 *  - /api/anchored-monitor/* 同源代理路由(loopback-only), 转发到独立监控进程
 *    (默认 http://127.0.0.1:9301, 可用 ~/.dsh/anchored-monitor.json 或环境变量
 *    ANCHORED_MONITOR_URL 覆盖); 监控进程离线时返回 502 + monitor-offline 提示。
 *  - systemPrompt.section 向 agent 宣发插件存在与协作方式。
 *  - /api/anchored-monitor/config: 读写插件配置(监控进程地址、启用开关)。
 *
 * 浏览器半边见 exports "./client"(lib/client.js)。
 * 监控进程本体(特征/窗口/评分/干预/实验日志)是独立 Node 进程, 与本插件解耦,
 * 启动方式: npx anchored-monitor --profile demo
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import path from 'node:path'

/** Stable cordis plugin name(与 cordis.patch.yml insert id 一致)。 */
export const name = 'anchored-monitor'

/** 挂载所需服务。 */
export const inject = ['webServer', 'systemPrompt']

/** Prompt 段顺序: 210 与 aionui-panel 相邻, 排在常规插件宣发之后。 */
const SECTION_ORDER = 210

/** 默认监控进程地址(本机独立进程)。 */
const DEFAULT_MONITOR_URL = 'http://127.0.0.1:9301'

/** Model-facing announcement。 */
export const GUIDANCE = '本机已安装 dsh-anchored-monitor 插件（实时思维链锚定监控与干预）：独立监控进程按 we/let\'s/let me 指纹持续评估思维链所处波段（spec 稳定带 <0.2 / mixed 过渡带 0.2-0.5 / react 行动者带 >=0.5），GUI 左侧栏「锚定监控」入口可打开液体毛玻璃浮层面板查看实时波段、强度分、趋势与干预级联，收起时以变阻器式悬浮条显示思考强度与最近日志。干预级别：L1 温和引导（建议式措辞注入，禁止命令式）/ L2 强制重置（persona 切回 Minimal 46 字符句 + bash/str_replace_editor 双工具）/ L3 建议会话重启。数据经 /api/anchored-monitor/* 同源路由转发；监控进程离线时面板会提示启动方式。用户提到「锚定监控 / 思维链监控 / 波段 / 思考强度」时即指本插件，请据此协作。'

const API_PREFIX = '/api/anchored-monitor'

function configPath() {
  return path.join(homedir(), '.dsh', 'anchored-monitor.json')
}

async function loadConfig() {
  try {
    const raw = await readFile(configPath(), 'utf8')
    const parsed = JSON.parse(raw)
    return {
      monitorUrl: typeof parsed.monitorUrl === 'string' && parsed.monitorUrl !== '' ? parsed.monitorUrl : (process.env.ANCHORED_MONITOR_URL || DEFAULT_MONITOR_URL),
      enabled: parsed.enabled !== false
    }
  } catch {
    return { monitorUrl: process.env.ANCHORED_MONITOR_URL || DEFAULT_MONITOR_URL, enabled: true }
  }
}

/** loopback-only 守卫(与 dsh-auto-memory 同款): 只接受本机回环请求。 */
function isLoopbackRequest(req) {
  const address = req && req.socket && req.socket.remoteAddress ? req.socket.remoteAddress : ''
  if (address !== '127.0.0.1' && address !== '::1' && address !== '::ffff:127.0.0.1') return false
  const host = req && req.headers && req.headers.host ? req.headers.host : ''
  const hostname = host.split(':')[0]
  return hostname === '127.0.0.1' || hostname === 'localhost' || hostname === '[::1]'
}

function writeJson(res, code, payload) {
  const body = JSON.stringify(payload)
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8' })
  res.end(body)
}

async function readJsonBody(req) {
  const chunks = []
  let total = 0
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    chunks.push(buffer)
    total += buffer.length
    if (total > 64 * 1024) return null
  }
  const text = Buffer.concat(chunks).toString('utf8')
  if (text === '') return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

/** 把请求原样转发到监控进程(带 2.5s 超时); 离线时返回 502 + 提示。 */
async function proxyGet(monitorUrl, req, res, monitorPath) {
  try {
    const qIndex = (req.url || '').indexOf('?')
    const query = qIndex >= 0 ? req.url.slice(qIndex) : ''
    const upstream = await fetch(monitorUrl + monitorPath + query, { signal: AbortSignal.timeout(2500) })
    const body = await upstream.text()
    res.writeHead(upstream.status, { 'content-type': 'application/json; charset=utf-8' })
    res.end(body)
  } catch (err) {
    writeJson(res, 502, {
      ok: false,
      monitorOnline: false,
      error: 'monitor-offline',
      hint: '监控进程未运行, 请启动: npx anchored-monitor --profile demo (仪表盘 http://127.0.0.1:9301)',
      detail: String(err && err.message ? err.message : err)
    })
  }
}

/**
 * 挂载代理路由与 prompt 宣发段。
 * @param ctx - cordis context(webServer + systemPrompt)
 */
export function apply(ctx) {
  let config = { monitorUrl: DEFAULT_MONITOR_URL, enabled: true }
  const reload = async () => {
    config = await loadConfig()
  }

  ctx.effect(() => {
    void reload()
    const disposers = []
    const routes = [
      {
        kind: 'exact',
        path: API_PREFIX + '/status',
        handler: async (req, res) => {
          if (!isLoopbackRequest(req)) return writeJson(res, 403, { error: 'forbidden: loopback-only' })
          if ((req.method || 'GET') !== 'GET') return writeJson(res, 405, { error: 'method not allowed' })
          await reload()
          let monitorOnline = false
          let version = null
          try {
            const upstream = await fetch(config.monitorUrl + '/api/health', { signal: AbortSignal.timeout(2000) })
            monitorOnline = upstream.ok
            if (upstream.ok) version = (await upstream.json()).version ?? null
          } catch {
            monitorOnline = false
          }
          writeJson(res, 200, { ok: true, enabled: config.enabled, monitorUrl: config.monitorUrl, monitorOnline, version })
        }
      },
      {
        kind: 'exact',
        path: API_PREFIX + '/config',
        handler: async (req, res) => {
          if (!isLoopbackRequest(req)) return writeJson(res, 403, { error: 'forbidden: loopback-only' })
          if (req.method === 'GET') {
            await reload()
            return writeJson(res, 200, { ok: true, ...config })
          }
          if (req.method === 'POST') {
            const payload = await readJsonBody(req)
            if (!payload || typeof payload !== 'object') return writeJson(res, 400, { ok: false, error: 'invalid JSON body' })
            const next = { ...config }
            if (typeof payload.monitorUrl === 'string' && /^https?:\/\//.test(payload.monitorUrl)) next.monitorUrl = payload.monitorUrl
            if (typeof payload.enabled === 'boolean') next.enabled = payload.enabled
            try {
              await mkdir(path.dirname(configPath()), { recursive: true })
              await writeFile(configPath(), JSON.stringify(next, null, 2), 'utf8')
            } catch (err) {
              return writeJson(res, 500, { ok: false, error: 'config write failed: ' + String(err && err.message ? err.message : err) })
            }
            config = next
            return writeJson(res, 200, { ok: true, ...config })
          }
          return writeJson(res, 405, { ok: false, error: 'method not allowed' })
        }
      },
      {
        kind: 'exact',
        path: API_PREFIX + '/overview',
        handler: async (req, res) => {
          if (!isLoopbackRequest(req)) return writeJson(res, 403, { error: 'forbidden: loopback-only' })
          if ((req.method || 'GET') !== 'GET') return writeJson(res, 405, { error: 'method not allowed' })
          if (!config.enabled) return writeJson(res, 200, { ok: false, enabled: false, monitorOnline: false, error: 'plugin-disabled' })
          return proxyGet(config.monitorUrl, req, res, '/api/overview')
        }
      },
      {
        kind: 'exact',
        path: API_PREFIX + '/sessions',
        handler: async (req, res) => {
          if (!isLoopbackRequest(req)) return writeJson(res, 403, { error: 'forbidden: loopback-only' })
          if ((req.method || 'GET') !== 'GET') return writeJson(res, 405, { error: 'method not allowed' })
          if (!config.enabled) return writeJson(res, 200, { ok: false, enabled: false, error: 'plugin-disabled' })
          return proxyGet(config.monitorUrl, req, res, '/api/sessions')
        }
      },
      {
        kind: 'exact',
        path: API_PREFIX + '/events',
        handler: async (req, res) => {
          if (!isLoopbackRequest(req)) return writeJson(res, 403, { error: 'forbidden: loopback-only' })
          if ((req.method || 'GET') !== 'GET') return writeJson(res, 405, { error: 'method not allowed' })
          if (!config.enabled) return writeJson(res, 200, { ok: false, enabled: false, error: 'plugin-disabled' })
          return proxyGet(config.monitorUrl, req, res, '/api/events')
        }
      },
      {
        kind: 'prefix',
        path: API_PREFIX + '/sessions/',
        handler: async (req, res) => {
          if (!isLoopbackRequest(req)) return writeJson(res, 403, { error: 'forbidden: loopback-only' })
          if ((req.method || 'GET') !== 'GET') return writeJson(res, 405, { error: 'method not allowed' })
          if (!config.enabled) return writeJson(res, 200, { ok: false, enabled: false, error: 'plugin-disabled' })
          const pathname = new URL(req.url || '/', 'http://localhost').pathname
          return proxyGet(config.monitorUrl, req, res, pathname.slice(API_PREFIX.length))
        }
      }
    ]
    for (const route of routes) disposers.push(ctx.webServer.register(route))
    disposers.push(ctx.systemPrompt.section({ name: 'plugin:anchored-monitor', order: SECTION_ORDER, text: GUIDANCE }))
    return () => {
      for (const dispose of disposers) {
        try {
          dispose()
        } catch {
          // 卸载失败不阻塞
        }
      }
    }
  }, 'dsh-anchored-monitor: host proxy + prompt section')
}

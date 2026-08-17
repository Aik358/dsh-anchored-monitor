/**
 * 开发用: 把插件客户端渲染进一个带 mock 槽位/真实数据的测试页
 * (供 vision_html_screenshot 做视觉验证, 不随 npm 发布)
 */
import { readFile, writeFile } from 'node:fs/promises'

const DSH = 'C:/Users/JH Z/AppData/Roaming/npm/node_modules/@deepseek-ai/dsh/node_modules'
const mode = process.argv[2] === 'bar' ? 'bar' : 'open'
const outFile = mode === 'bar' ? 'demo-data/plugin-bar.html' : 'demo-data/plugin-open.html'
const [react, reactDom, client, overviewRes] = await Promise.all([
  readFile(DSH + '/react/umd/react.production.min.js', 'utf8'),
  readFile(DSH + '/react-dom/umd/react-dom.production.min.js', 'utf8'),
  readFile('lib/client.js', 'utf8'),
  fetch('http://127.0.0.1:9301/api/overview').then((r) => r.text())
])
const embed = overviewRes.replace(/</g, '\\u003c')

const page = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><title>plugin test</title>
<style>
  body { margin: 0; font-family: "Segoe UI", "PingFang SC", system-ui, sans-serif; background: #f4f6fb; height: 100vh; overflow: hidden; }
  .shell { display: flex; height: 100vh; }
  .rail { width: 220px; background: #ffffff; border-right: 1px solid #e5e9f2; padding: 18px 12px; display: flex; flex-direction: column; gap: 8px; }
  .rail .logo { font-weight: 700; font-size: 14px; color: #1f2329; padding: 4px 10px 14px; }
  .nav-item { padding: 9px 12px; border-radius: 9px; color: #667085; font-size: 13px; }
  .nav-item.active { background: rgba(77,107,254,0.10); color: #4d6bfe; }
  .rail-footer { margin-top: auto; border-top: 1px solid #e5e9f2; padding-top: 10px; display: flex; flex-direction: column; gap: 6px; }
  .chat { flex: 1; padding: 40px 48px; position: relative; overflow: hidden; }
  .msg-user { margin-left: auto; width: 60%; background: #4d6bfe; color: #fff; border-radius: 16px 16px 4px 16px; padding: 12px 16px; font-size: 14px; }
  .msg-ai { width: 72%; background: #fff; border-radius: 16px 16px 16px 4px; padding: 12px 16px; font-size: 14px; color: #1f2329; box-shadow: 0 2px 10px rgba(15,23,42,0.06); margin-top: 14px; }
  .code { background: #0b1020; color: #dbe4ff; border-radius: 10px; padding: 10px 12px; font-family: Consolas, monospace; font-size: 12px; margin-top: 8px; }
</style></head>
<body>
  <div class="shell">
    <div class="rail">
      <div class="logo">DeepSeek Harness</div>
      <div class="nav-item active">▣ 新对话</div>
      <div class="nav-item">◈ 历史会话</div>
      <div class="nav-item">⚙ 设置</div>
      <div class="rail-footer" id="side"></div>
    </div>
    <div class="chat">
      <div class="msg-user">帮我把这个监控插件的前端改成液体毛玻璃风格，收起时显示思考强度条</div>
      <div class="msg-ai">好的，我们先把扩展点摸清：sidebar.footer.action 提供左侧入口，shell.overlay 提供浮层槽位。<div class="code">we will verify the slot contract first · we need to check the profile patch · our plan: ship the overlay, then the bar</div></div>
      <div class="msg-ai" style="margin-top:14px">…对话内容持续滚动中…</div>
    </div>
  </div>
  <div id="host"></div>
  <script>
    window.__ModuleLoader__ = {
      load: function (o) {
        var require = function (name) {
          if (name === 'react') return window.React
          throw new Error('unknown module: ' + name)
        }
        window.__PLUGIN__ = o.factory(require)
      }
    }
  </script>
  <script>${react}</script>
  <script>${reactDom}</script>
  <script>
    window.__REACT_DOM__ = window.ReactDOM
  </script>
  <script>${client}</script>
  <script>
    var EMBED = ${embed}
    window.fetch = function (url) {
      return Promise.resolve({
        ok: true, status: 200,
        json: function () { return Promise.resolve(EMBED) },
        text: function () { return Promise.resolve(JSON.stringify(EMBED)) }
      })
    }
    var registrations = []
    var slots = {
      inject: function (name, fn) {
        try { var reg = fn(); if (reg) registrations.push({ name: name, reg: reg }) } catch (e) { console.warn('inject fail', name, e) }
      },
      register: function (opts, elFactory) {
        return { name: opts.name, id: opts.id, order: opts.order, label: opts.label, elFactory: elFactory }
      }
    }
    var ctx = { slots: slots, sessions: { list: { getSnapshot: function () { return { current: null, byId: {} } } } } }
    window.__PLUGIN__.apply(ctx)
    window.addEventListener('load', function () {
      registrations.forEach(function (r) {
        var el = r.reg.elFactory()
        if (r.reg.name === 'shell.overlay') {
          window.__REACT_DOM__.createRoot(document.getElementById('host')).render(el)
        } else {
          window.__REACT_DOM__.createRoot(document.getElementById('side')).render(el)
        }
      })
      if ('${mode}' === 'open') {
        setTimeout(function () {
          var entry = document.querySelector('.am-side-entry')
          if (entry) entry.dispatchEvent(new MouseEvent('click', { bubbles: true }))
        }, 150)
      }
    })
  </script>
</body></html>
`

await writeFile(outFile, page, 'utf8')
console.log(outFile, 'written:', page.length, 'bytes | embed overview:', overviewRes.length, 'bytes')

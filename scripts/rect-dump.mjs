/**
 * 开发用: 在 mock bar 页面注入 DOM 检查脚本, 输出气泡/knob/轨道/表情 img 的实测状态。
 * 用法: node scripts/rect-dump.mjs
 */
import { readFile, writeFile } from 'node:fs/promises'

let h = await readFile('demo-data/plugin-bar.html', 'utf8')

// 关键: localStorage 注入必须出现在 client bundle 脚本之前,
// 否则 client 加载时读到的是默认 serious(此前 mock 一直是严肃模式)。
const skinSeed = "<script>try{localStorage.setItem('dsh-anchored-monitor.skin','meme');localStorage.setItem('dsh-anchored-monitor.welcomed','1')}catch(e){}</script>\n"
const loaderMarker = '<script>\n    window.__ModuleLoader__'
if (!h.includes(loaderMarker)) throw new Error('loader marker not found')
h = h.replace(loaderMarker, skinSeed + loaderMarker)

const dump = `<script>
window.addEventListener('load', function () {
  setTimeout(function () {
    var q = function (s) {
      var el = document.querySelector(s)
      if (!el) return null
      var r = el.getBoundingClientRect()
      return { left: Math.round(r.left), top: Math.round(r.top), right: Math.round(r.right), bottom: Math.round(r.bottom), w: Math.round(r.width), h: Math.round(r.height) }
    }
    var face = document.querySelector('[data-am=face]')
    var out = {
      skin: (function () { try { return localStorage.getItem('dsh-anchored-monitor.skin') } catch (e) { return 'ERR' } })(),
      bar: q('.am-bar'),
      track: q('.am-bar-track'),
      knob: q('[data-am=knob]'),
      bubble: q('[data-am=bubble]'),
      face: q('[data-am=face]'),
      faceSrcPrefix: face ? String(face.src).slice(0, 22) : null,
      faceSrcLen: face ? String(face.src).length : null,
      faceLoaded: face ? (face.complete && face.naturalWidth > 0) : null,
      faceNatural: face ? (face.naturalWidth + 'x' + face.naturalHeight) : null,
      scoreText: document.querySelector('[data-am=score]') ? document.querySelector('[data-am=score]').textContent : null,
      bubbleCss: (function () { var el = document.querySelector('[data-am=bubble]'); if (!el) return null; var cs = getComputedStyle(el); return { bottom: cs.bottom, transform: cs.transform, position: cs.position } })()
    }
    var pre = document.createElement('pre')
    pre.id = 'rects'
    pre.textContent = JSON.stringify(out, null, 1)
    document.body.appendChild(pre)
  }, 1800)
})
<\/script>`

h = h.replace('</body>', dump + '</body>')
await writeFile('demo-data/plugin-bar-rects.html', h, 'utf8')
console.log('written demo-data/plugin-bar-rects.html')

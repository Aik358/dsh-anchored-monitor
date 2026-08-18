/**
 * 组装浏览器半边 bundle: plugin-client/part1..part4 → lib/client.js
 * (part1 的 `return module.exports` 之前插入 part2/part3/part4, 保持同一 loader factory 作用域)
 */
import { readFile, writeFile, readdir } from 'node:fs/promises'

const part1 = await readFile(new URL('../plugin-client/part1.js', import.meta.url), 'utf8')
const part2 = await readFile(new URL('../plugin-client/part2.js', import.meta.url), 'utf8')
const part3 = await readFile(new URL('../plugin-client/part3.js', import.meta.url), 'utf8')
const part4 = await readFile(new URL('../plugin-client/part4.js', import.meta.url), 'utf8')

// 表情素材内嵌: assets/liang/liang-0..5.png → base64 data URI 常量表(本地永远可用, 不依赖路由)
const assetsDir = new URL('../assets/liang/', import.meta.url)
const files = (await readdir(assetsDir)).filter((f) => /^liang-\d+\.png$/.test(f)).sort()
const entries = []
for (const f of files) {
  const buf = await readFile(new URL(f, assetsDir))
  const idx = Number(f.match(/^liang-(\d+)\.png$/)[1])
  entries.push(idx + ": 'data:image/png;base64," + buf.toString('base64') + "'")
}
const assetsPart = '\n    // LIANG_DATA: 由 assemble 脚本自动生成(assets/liang/*.png → base64 data URI), 勿手改。\n'
  + '    var LIANG_DATA = {\n      ' + entries.join(',\n      ') + '\n    }\n'

const marker = '    return module.exports'
if (!part1.includes(marker)) throw new Error('part1 缺少 return module.exports 标记')
const bundle = part1.replace(marker, assetsPart + part2 + '\n' + part3 + '\n' + part4 + '\n' + marker)
await writeFile(new URL('../lib/client.js', import.meta.url), bundle, 'utf8')
console.log('[assemble-client] lib/client.js = ' + bundle.length + ' bytes (' + entries.length + ' embedded liang faces)')

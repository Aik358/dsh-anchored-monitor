/**
 * 组装浏览器半边 bundle: plugin-client/part1..part4 → lib/client.js
 * (part1 的 `return module.exports` 之前插入 part2/part3/part4, 保持同一 loader factory 作用域)
 */
import { readFile, writeFile } from 'node:fs/promises'

const part1 = await readFile(new URL('../plugin-client/part1.js', import.meta.url), 'utf8')
const part2 = await readFile(new URL('../plugin-client/part2.js', import.meta.url), 'utf8')
const part3 = await readFile(new URL('../plugin-client/part3.js', import.meta.url), 'utf8')
const part4 = await readFile(new URL('../plugin-client/part4.js', import.meta.url), 'utf8')
const marker = '    return module.exports'
if (!part1.includes(marker)) throw new Error('part1 缺少 return module.exports 标记')
const bundle = part1.replace(marker, part2 + '\n' + part3 + '\n' + part4 + '\n' + marker)
await writeFile(new URL('../lib/client.js', import.meta.url), bundle, 'utf8')
console.log('[assemble-client] lib/client.js = ' + bundle.length + ' bytes')

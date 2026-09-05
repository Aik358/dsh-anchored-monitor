#!/usr/bin/env node
// scripts/test-label-subagent.mjs — 0.3.1 行为自测(dev-only, 不随包发布)
let pass = 0, fail = 0
const check = (name, cond, extra) => {
  if (cond) { pass++; console.log('  ok  ' + name) }
  else { fail++; console.log('XX FAIL ' + name + (extra ? ' :: ' + extra : '')) }
}

// ---------- 宿主 lib/index.js 逻辑(逐字对齐) ----------
function hostSessionMeta(session) {
  const ws = (session.header && session.header.cwd) ? session.header.cwd : (session.workspace || '')
  const sub = !!(session.header && session.header.parentSession)
  return { workspace: ws, subagent: sub }
}
function hostShouldPush(sessionId, metaMap) {
  const m = metaMap.get(sessionId)
  return !(m && m.subagent)
}
const metaMap = new Map()
const mainSess = { id: 'main-1', header: { cwd: 'E:/proj-a' } }
const subSess = { id: 'sub-1', header: { cwd: 'E:/proj-a', parentSession: 'main-1' } }
metaMap.set(mainSess.id, hostSessionMeta(mainSess))
metaMap.set(subSess.id, hostSessionMeta(subSess))

console.log('-- host subagent gate --')
check('main meta.subagent=false', hostSessionMeta(mainSess).subagent === false)
check('main records workspace', hostSessionMeta(mainSess).workspace === 'E:/proj-a')
check('subagent meta.subagent=true (header.parentSession)', hostSessionMeta(subSess).subagent === true)
check('main allowed to push', hostShouldPush(mainSess.id, metaMap) === true)
check('subagent blocked from push', hostShouldPush(subSess.id, metaMap) === false)

// ---------- client part1 逻辑(核心决策逐字对齐) ----------
function wsBase(w) {
  if (!w) return ''
  const s = String(w).replace(/\\/g, '/').replace(/\/+$/, '')
  const i = s.lastIndexOf('/')
  return i >= 0 ? s.slice(i + 1) : s
}
function shortId(id) { const s = String(id || ''); return s.length > 14 ? s.slice(0, 13) + '...' : s }
function sessionLabel(g, s, id) {
  const sid = id || (s && s.sessionId) || ''
  if (g && g.title && String(g.title).trim()) return String(g.title).trim()
  if (s && s.title && String(s.title).trim()) return String(s.title).trim()
  if (g && g.cwd && String(g.cwd).trim()) return wsBase(g.cwd)
  if (s && s.workspace && String(s.workspace).trim()) return wsBase(s.workspace)
  return shortId(sid)
}
function guiMainId(snap, id) {
  if (!snap) return true
  if (snap.byId) return !!snap.byId[id]
  return true
}
console.log('-- client label priority --')
const gui = { title: '记忆插件重构对话', cwd: 'E:/proj-a' }
const mon = { sessionId: 'main-1', workspace: 'E:/proj-b' }
check('GUI title wins', sessionLabel(gui, mon, 'main-1') === '记忆插件重构对话')
check('monitor title when no GUI', sessionLabel(null, { sessionId: 'm2', title: '监控侧标题', workspace: 'E:/x' }, 'm2') === '监控侧标题')
check('GUI cwd basename', sessionLabel({ cwd: 'E:/proj-a' }, mon, 'main-1') === 'proj-a')
check('monitor workspace basename', sessionLabel(null, { sessionId: 'm3', workspace: 'E:/proj-b' }, 'm3') === 'proj-b')
check('shortId fallback', sessionLabel(null, null, '0123456789abcdef') === '0123456789abc...')
check('wsBase backslashes', wsBase('E:\\proj\\MyWs') === 'MyWs')
console.log('-- client guiMainId follow guard --')
const snapById = { byId: { 'main-1': { title: 'x' }, 'main-2': {} } }
check('main in byId -> followable', guiMainId(snapById, 'main-2') === true)
check('subagent not in byId -> not followed', guiMainId(snapById, 'sub-1') === false)
check('no sessions svc -> allow (standalone)', guiMainId(null, 'sub-1') === true)

console.log('PASS=' + pass + ' FAIL=' + fail)
process.exit(fail ? 1 : 0)

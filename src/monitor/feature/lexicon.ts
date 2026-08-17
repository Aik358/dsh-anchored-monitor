/**
 * 词典加载与编译: 把 YAML 词典编译成正则并复用
 * 匹配口径对齐 dsh-anchored-flash verify/count-pronouns.mjs:
 *   we → \bwe\b / let's → \blet'?s\b / let me → \blet\s+me\b (整词, 大小写不敏感)
 */

import type { LexiconConfig, LexiconEntry, RegexFeature } from '../../shared/types.js'

export interface CompiledEntry {
  group: 'positive' | 'negative' | 'neutral'
  term: string
  weight: number
  regex: RegExp
}

export interface CompiledLexicon {
  entries: CompiledEntry[]
  regexFeatures: { name: string; regex: RegExp; weight: number }[]
  /** 正向/负向词项名集合(供 persona_ratio 计算) */
  positiveTerms: Set<string>
  negativeTerms: Set<string>
}

export function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function compileEntry(e: LexiconEntry): RegExp {
  const flags = e.caseInsensitive === false ? 'g' : 'gi'
  if (e.match === 'exact') return new RegExp('^' + escapeRegExp(e.term) + '$', flags)
  if (e.match === 'regex') return new RegExp(e.term, flags)
  // word: 词边界匹配; 弯引号在 extractor 中已归一化为直引号
  return new RegExp('\\b' + escapeRegExp(e.term) + '\\b', flags)
}

export function compileLexicon(
  config: LexiconConfig,
  regexFeatures: RegexFeature[]
): CompiledLexicon {
  const entries: CompiledEntry[] = []
  for (const group of ['positive', 'negative', 'neutral'] as const) {
    for (const e of config[group]) {
      entries.push({ group, term: e.term, weight: Math.abs(e.weight), regex: compileEntry(e) })
    }
  }
  return {
    entries,
    regexFeatures: regexFeatures.map((rf) => ({ name: rf.name, regex: new RegExp(rf.pattern, 'gm'), weight: rf.weight })),
    positiveTerms: new Set(config.positive.map((e) => e.term)),
    negativeTerms: new Set(config.negative.map((e) => e.term))
  }
}

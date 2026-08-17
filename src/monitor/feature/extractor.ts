/**
 * 特征提取器: 对每个 reasoning 块统计词频, 输出 FeatureVector
 */

import type { FeatureVector, ReasoningBlock } from '../../shared/types.js'
import type { CompiledLexicon } from './lexicon.js'

export class FeatureExtractor {
  constructor(private readonly lexicon: CompiledLexicon) {}

  extract(block: ReasoningBlock): FeatureVector {
    // 弯引号归一化: "let’s" 与 "let's" 同词
    const text = block.text.replace(/[\u2018\u2019]/g, "'")
    const counts: Record<string, number> = {}
    let positive = 0
    let negative = 0
    let neutral = 0

    for (const e of this.lexicon.entries) {
      const m = text.match(e.regex)
      const n = m ? m.length : 0
      if (n > 0) {
        counts[e.term] = (counts[e.term] ?? 0) + n
        const contrib = n * e.weight
        if (e.group === 'positive') positive += contrib
        else if (e.group === 'negative') negative += contrib
        else neutral += contrib
      }
    }

    let punctuation = 0
    const punc = text.match(/[.!?,;:]/g)
    punctuation = punc ? punc.length : 0
    let questionMarks = 0

    for (const rf of this.lexicon.regexFeatures) {
      const m = text.match(rf.regex)
      const n = m ? m.length : 0
      if (n > 0) {
        counts[rf.name] = (counts[rf.name] ?? 0) + n
        neutral += n * rf.weight
      }
      if (rf.name === 'question_marks') questionMarks = n
    }

    return {
      counts,
      weighted: { positive, negative, neutral },
      meta: {
        length: block.text.length,
        punctuation,
        questionMarks
      }
    }
  }
}

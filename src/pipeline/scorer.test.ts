import { describe, expect, it } from 'vitest'
import { score } from './scorer'

const wordsOf = (text: string) =>
  score(text).flatMap((phrase) => phrase.words.map((word) => word.text))

describe('the Scorer conserves words', () => {
  it('emits every input word exactly once, in order', () => {
    expect(wordsOf('the quick brown fox jumps')).toEqual([
      'the',
      'quick',
      'brown',
      'fox',
      'jumps',
    ])
  })

  it('collapses runs of whitespace without losing or inventing words', () => {
    expect(wordsOf('  spaced   out \n text  ')).toEqual(['spaced', 'out', 'text'])
  })
})

describe('the Scorer survives degenerate input', () => {
  it.each([
    ['an empty string', ''],
    ['whitespace only', '   \n\t  '],
    ['a single word', 'solo'],
    ['no punctuation at all', 'one two three four five'],
    ['punctuation only', '... --- !!!'],
    ['a very long URL', `https://example.com/${'a'.repeat(180)}`],
    ['emoji', 'shipped it 🚀 finally'],
    ['combining accents', 'café naïve résumé'],
  ])('returns a valid structure for %s', (_label, text) => {
    const phrases = score(text)

    expect(Array.isArray(phrases)).toBe(true)
    for (const phrase of phrases) {
      expect(phrase.words.length).toBeGreaterThan(0)
      expect(['hard', 'soft']).toContain(phrase.breakAfter)
    }
  })
})

describe('the Scorer is deterministic', () => {
  it('returns the same result for the same input', () => {
    const text = 'ship it, then measure it. twice.'
    expect(score(text)).toEqual(score(text))
  })
})

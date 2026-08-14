import type { Phrase, Word } from './types'

/**
 * Which words carry the sentence.
 *
 * Kept apart from phrase structure because these are the heuristics that get
 * tuned by eye against real posts — the part a competitor cannot trivially
 * clone, and the difference between "template filler" and "it understood my
 * sentence."
 *
 * Signals are layered, strongest first:
 *   lexical (digits, currency, percentages) > positional (the word a sentence
 *   lands on) > morphological (long words carry more) > suppression (stopwords
 *   never take a beat, wherever they sit).
 */

const EMPHASIS_THRESHOLD = 0.6

const WEIGHT = {
  numeric: 1,
  sentenceFinal: 0.7,
  long: 0.55,
  ordinary: 0.3,
  stopword: 0.05,
} as const

const LONG_WORD_CHARS = 8

/** Any digit at all: covers 47, $12,000, 23%, 3.5x, Q4. */
const NUMERIC = /\d/

const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'so', 'yet', 'nor', 'for',
  'of', 'to', 'in', 'on', 'at', 'by', 'from', 'with', 'into', 'over',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'am',
  'it', 'its', 'this', 'that', 'these', 'those', 'there', 'here',
  'i', 'we', 'you', 'they', 'he', 'she', 'them', 'us', 'me', 'my',
  'our', 'your', 'their', 'his', 'her',
  'as', 'if', 'than', 'then', 'when', 'while', 'because',
  'do', 'does', 'did', 'have', 'has', 'had',
  'will', 'would', 'can', 'could', 'should', 'may', 'might', 'must',
  'not', 'no', 'up', 'out', 'about', 'just', 'very',
])

export function assignEmphasis(phrases: Phrase[]): Phrase[] {
  return phrases.map((phrase, index) => {
    const landsHere =
      phrase.breakAfter === 'hard' || index === phrases.length - 1

    const weighed = phrase.words.map((word) => ({
      ...word,
      weight: weigh(word.text),
    }))

    if (landsHere) liftClosingWord(weighed)

    return {
      ...phrase,
      words: weighed.map((word) => ({
        ...word,
        emphasis: word.weight >= EMPHASIS_THRESHOLD,
      })),
    }
  })
}

function weigh(token: string): number {
  if (NUMERIC.test(token)) return WEIGHT.numeric

  const bare = bareWord(token)
  if (STOPWORDS.has(bare)) return WEIGHT.stopword
  if (bare.length >= LONG_WORD_CHARS) return WEIGHT.long

  return WEIGHT.ordinary
}

/**
 * A sentence lands on its last real word. Stopwords are skipped rather than
 * lifted — "was" at the end of a sentence is still "was".
 */
function liftClosingWord(words: Word[]): void {
  for (let index = words.length - 1; index >= 0; index--) {
    const word = words[index]!
    if (STOPWORDS.has(bareWord(word.text))) continue

    word.weight = Math.max(word.weight, WEIGHT.sentenceFinal)
    return
  }
}

const bareWord = (token: string) =>
  token.replace(/[^\p{L}\p{N}'-]/gu, '').toLowerCase()

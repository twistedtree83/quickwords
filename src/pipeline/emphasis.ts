import { CLOSES_QUOTE, OPENS_QUOTE } from './quotes'
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
 *   author (asterisks) > typographic (shouting, quotation) > lexical (digits,
 *   currency, percentages) > positional (the word a sentence lands on) >
 *   morphological (long words) > suppression (stopwords).
 *
 * The ordering is the point. An asterisk-wrapped stopword is emphasised: the
 * explicit signal wins over the suppression rule, because the author knows
 * something the heuristics do not.
 */

const EMPHASIS_THRESHOLD = 0.6

const WEIGHT = {
  /** Anything the author marked themselves. Nothing outranks this. */
  overridden: 1,
  numeric: 1,
  sentenceFinal: 0.7,
  long: 0.55,
  ordinary: 0.3,
  stopword: 0.05,
} as const

const LONG_WORD_CHARS = 8

/** Any digit at all: covers 47, $12,000, 23%, 3.5x, Q4. */
const NUMERIC = /\d/

/** *word* — asterisks delimit, and never survive into the video. */
const AUTHOR_MARKED = /^\*([^*]+)\*$/

/** Two letters or more, so "I" and "a" are not mistaken for shouting. */
const SHOUTED = /^\p{Lu}{2,}$/u

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
    const quoted = quotedPositions(phrase.words)
    const landsHere =
      phrase.breakAfter === 'hard' || index === phrases.length - 1

    const weighed = phrase.words.map((word, position) => {
      const marked = AUTHOR_MARKED.exec(word.text)
      const text = marked ? marked[1]! : word.text
      const overridden =
        marked !== null || isShouted(text) || quoted.has(position)

      return {
        ...word,
        text,
        weight: overridden ? WEIGHT.overridden : weigh(text),
      }
    })

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

const isShouted = (token: string) => SHOUTED.test(strip(token))

/**
 * Every position inside a closed quotation. An unclosed quote is left alone —
 * guessing where the author meant it to end would emphasise the rest of the
 * post.
 */
function quotedPositions(words: Word[]): Set<number> {
  const inside = new Set<number>()

  for (let open = 0; open < words.length; open++) {
    if (!OPENS_QUOTE.test(words[open]!.text)) continue

    for (let close = open; close < words.length; close++) {
      if (!CLOSES_QUOTE.test(words[close]!.text)) continue

      for (let position = open; position <= close; position++) {
        inside.add(position)
      }
      open = close
      break
    }
  }

  return inside
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

const strip = (token: string) => token.replace(/[^\p{L}\p{N}'-]/gu, '')
const bareWord = (token: string) => strip(token).toLowerCase()

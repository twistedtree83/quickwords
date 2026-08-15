import { isCommonplace } from './common-words'
import { CLOSES_QUOTE, OPENS_QUOTE } from './quotes'
import { bareWord, bareWordPreservingCase, isStopword } from './stopwords'
import type { Phrase, Word } from './types'

/**
 * Which words carry the sentence.
 *
 * Kept apart from phrase structure because these are the heuristics that get
 * tuned by eye against real posts — the part a competitor cannot trivially
 * clone, and the difference between "template filler" and "it understood my
 * sentence."
 *
 * Emphasis is *ranked and budgeted*, not thresholded. Every word gets a score
 * for how much information it carries, and each phrase spends a small budget
 * on its highest scorers. A threshold made emphasis depend on absolute scores
 * that had to be retuned whenever a signal changed, and it let signals stack
 * until three words in a row fired. A budget cannot do that.
 *
 * Signals, strongest first:
 *   author marks and quotation are *forced* — they say what the writer meant.
 *   Everything else competes: numbers, then shouting, then distinctiveness
 *   (a word not in everyday use), then commonplace words, and stopwords never
 *   compete at all.
 */

const WEIGHT = {
  /** Author marks and quotation. Never ranked — always emphasised. */
  forced: 1,
  numeric: 0.95,
  shouted: 0.85,
  distinctive: 0.62,
  commonplace: 0.35,
  stopword: 0.05,
} as const

/** A long word is usually a specific one. Breaks ties, never decides alone. */
const LONG_WORD_CHARS = 9
const LONG_WORD_BONUS = 0.06

/** The word a sentence lands on gets a nudge, not a coronation. */
const CLOSING_BONUS = 0.08

/**
 * One hero word per frame.
 *
 * A phrase caps at five words, so this resolves to a single emphasis for
 * almost every frame. Review at one-in-three put roughly 40% of a post in
 * bold, and 40% bold reads as no emphasis at all — the eye needs somewhere to
 * land, not a highlighter. Forced words are exempt: a quoted span is emphasised
 * whole however long it is.
 */
const WORDS_PER_EMPHASIS = 4

/** Any digit at all: covers 47, $12,000, 23%, 3.5x, Q4. */
const NUMERIC = /\d/

/** *word* — asterisks delimit, and never survive into the video. */
const AUTHOR_MARKED = /^\*([^*]+)\*$/

/** Two letters or more, so "I" and "a" are not mistaken for shouting. */
const SHOUTED = /^\p{Lu}{2,}$/u

type Scored = Word & { forced: boolean; repeat: boolean }

export function assignEmphasis(phrases: Phrase[]): Phrase[] {
  // Words already given their moment. A key word repeated across a post is
  // still one idea, and emphasising it every time reads as a stuck highlighter
  // rather than as a point being made.
  const alreadyUsed = new Set<string>()

  return phrases.map((phrase, index) => {
    const quoted = quotedPositions(phrase.words)
    const landsHere =
      phrase.breakAfter === 'hard' || index === phrases.length - 1

    const scored: Scored[] = phrase.words.map((word, position) => {
      const marked = AUTHOR_MARKED.exec(word.text)
      const text = marked ? marked[1]! : word.text

      // Quotation forces the span it encloses, minus its stopwords — "on" and
      // "a" inside a quote are still "on" and "a".
      const forced =
        marked !== null || (quoted.has(position) && !isStopword(text))

      return {
        ...word,
        text,
        forced,
        repeat: alreadyUsed.has(bareWord(text)),
        weight: forced ? WEIGHT.forced : weigh(text),
        emphasis: false,
      }
    })

    if (landsHere) nudgeClosingWord(scored)

    const spent = spendBudget(scored)
    for (const word of spent) {
      if (word.emphasis) alreadyUsed.add(bareWord(word.text))
    }

    return { ...phrase, words: spent.map(stripScoring) }
  })
}

function weigh(token: string): number {
  if (NUMERIC.test(token)) return WEIGHT.numeric
  // Shouting is checked before suppression: a deliberate "NOT" in capitals is
  // the author telling us something, and it outranks the fact that "not" is a
  // stopword. It still only competes, so an acronym cannot crowd out the
  // number beside it.
  if (isShouted(token)) return WEIGHT.shouted
  if (isStopword(token)) return WEIGHT.stopword

  const bare = bareWord(token)
  if (isCommonplace(bare)) return WEIGHT.commonplace

  return (
    WEIGHT.distinctive + (bare.length >= LONG_WORD_CHARS ? LONG_WORD_BONUS : 0)
  )
}

const isShouted = (token: string) => SHOUTED.test(bareWordPreservingCase(token))

/** Only a word that *competes* can be picked from the ranking. */
const competes = (word: Scored) => !isStopword(word.text) || isShouted(word.text)

/**
 * Emphasises the forced words, then the highest scorers until the budget runs
 * out. The budget is what guarantees a phrase is never blank and never
 * shouted — both of which the old threshold allowed.
 */
function spendBudget(words: Scored[]): Scored[] {
  const budget = Math.max(1, Math.floor(words.length / WORDS_PER_EMPHASIS))

  for (const word of words) {
    if (word.forced) word.emphasis = true
  }

  const spent = words.filter((word) => word.emphasis).length
  const remaining = budget - spent
  if (remaining <= 0) return words

  words
    .filter((word) => !word.emphasis && competes(word))
    // Anything not yet used outranks anything already emphasised, whatever
    // their weights. A repeat is a last resort, not a discount — which is a
    // rule, rather than a penalty constant that needs retuning.
    .sort((a, b) => Number(a.repeat) - Number(b.repeat) || b.weight - a.weight)
    .slice(0, remaining)
    .forEach((word) => {
      word.emphasis = true
    })

  return words
}

/**
 * A sentence lands on its last real word, which deserves a tiebreak — not the
 * automatic emphasis it used to get, which made the whole tool a punchline
 * bolder rather than something that finds the argument.
 */
function nudgeClosingWord(words: Scored[]): void {
  for (let index = words.length - 1; index >= 0; index--) {
    const word = words[index]!
    if (isStopword(word.text) || word.forced) continue

    word.weight = Math.min(WEIGHT.numeric, word.weight + CLOSING_BONUS)
    return
  }
}

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

const stripScoring = ({
  forced: _forced,
  repeat: _repeat,
  ...word
}: Scored): Word => word

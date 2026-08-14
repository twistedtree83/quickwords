import { MAX_PHRASE_CHARS, MAX_PHRASE_WORDS } from './budget'
import { assignEmphasis } from './emphasis'
import { CLOSES_QUOTE, OPENS_QUOTE } from './quotes'
import { isStopword } from './stopwords'
import type { Phrase, Word } from './types'

/** Sentence-ending punctuation, allowing for a trailing quote or bracket. */
const HARD_BREAK = /[.!?]+["'”’)\]]*$/
/** Mid-sentence punctuation: a shorter rest than a full stop. */
const SOFT_BREAK = /[,;:—–]["'”’)\]]*$/

/** A conjunction opens a new thought, so the phrase starts there. */
const CONJUNCTIONS = new Set([
  'and',
  'but',
  'or',
  'so',
  'yet',
  'nor',
  'because',
  'while',
  'then',
])

const CAPITALIZED = /^\p{Lu}/u
const HAS_DIGIT = /\d/

/** Runaway guard: an unbalanced opening quote must not swallow the rest. */
const MAX_QUOTED_SPAN_TOKENS = 20

/**
 * Turns raw text into scored phrases.
 *
 * Pure: no DOM, no canvas, no clock. Everything the Scorer knows is internal,
 * so the interface stays one function of one argument.
 *
 * Three steps: split into tokens, gather the spans that must never be broken
 * apart, then pack those spans into phrases that fit the frame.
 */
export function score(text: string): Phrase[] {
  const tokens = text.split(/\s+/).filter((token) => token.length > 0)
  return assignEmphasis(packIntoPhrases(gatherAtomicSpans(tokens)))
}

/**
 * Groups tokens that have to travel together — quoted spans and multi-word
 * proper nouns. Everything else is a group of one. Breaking then operates on
 * groups, so no rule downstream can split what belongs together.
 */
function gatherAtomicSpans(tokens: string[]): string[][] {
  const groups: string[][] = []
  let sentenceStart = true
  let index = 0

  while (index < tokens.length) {
    const group =
      takeQuotedSpan(tokens, index) ??
      takeMeasurement(tokens, index) ??
      takeProperNounRun(tokens, index, sentenceStart) ?? [tokens[index]!]

    groups.push(group)
    sentenceStart = HARD_BREAK.test(group[group.length - 1]!)
    index += group.length
  }

  return groups
}

function takeQuotedSpan(tokens: string[], start: number): string[] | null {
  const first = tokens[start]!
  if (!OPENS_QUOTE.test(first)) return null
  if (first.length > 1 && CLOSES_QUOTE.test(first)) return [first]

  const limit = Math.min(tokens.length, start + MAX_QUOTED_SPAN_TOKENS)
  for (let end = start + 1; end < limit; end++) {
    if (CLOSES_QUOTE.test(tokens[end]!)) return tokens.slice(start, end + 1)
  }

  // Unbalanced quote: treat it as ordinary text rather than guessing.
  return null
}

/**
 * A number and the thing it measures. "40 seconds" is one fact and must not
 * land on two frames; "3rd at" is not, so a following stopword never binds.
 */
function takeMeasurement(tokens: string[], start: number): string[] | null {
  const number = tokens[start]!
  if (!HAS_DIGIT.test(number)) return null

  const unit = tokens[start + 1]
  if (unit === undefined) return null
  if (HAS_DIGIT.test(unit) || isStopword(unit)) return null

  return [number, unit]
}

function takeProperNounRun(
  tokens: string[],
  start: number,
  sentenceStart: boolean,
): string[] | null {
  // The capital at the start of a sentence carries no information about
  // whether the word is a name.
  if (sentenceStart) return null
  if (!CAPITALIZED.test(tokens[start]!)) return null

  let end = start
  while (end + 1 < tokens.length && CAPITALIZED.test(tokens[end + 1]!)) end++

  return end > start ? tokens.slice(start, end + 1) : null
}

function packIntoPhrases(groups: string[][]): Phrase[] {
  const phrases: Phrase[] = []
  let pending: Word[] = []

  const flush = (breakAfter: Phrase['breakAfter']) => {
    if (pending.length === 0) return
    phrases.push({ words: pending, breakAfter })
    pending = []
  }

  for (const group of groups) {
    // A phrase already in progress yields to a new thought or a full frame.
    // An empty one never does, so an over-long span still gets through rather
    // than looping — fitting it is the Renderer's job.
    if (pending.length > 0) {
      if (CONJUNCTIONS.has(stripPunctuation(group[0]!))) flush('soft')
      else if (wouldOverflow(pending, group)) flush('soft')
    }

    for (const token of group) {
      pending.push({ text: token, weight: 0, emphasis: false })
    }

    const last = group[group.length - 1]!
    if (HARD_BREAK.test(last)) flush('hard')
    else if (SOFT_BREAK.test(last)) flush('soft')
  }

  flush('soft')

  return phrases
}

function wouldOverflow(pending: Word[], group: string[]): boolean {
  const pendingChars = joinedLength(pending.map((word) => word.text))
  const groupChars = joinedLength(group)

  return (
    pending.length + group.length > MAX_PHRASE_WORDS ||
    pendingChars + 1 + groupChars > MAX_PHRASE_CHARS
  )
}

const joinedLength = (parts: string[]) =>
  parts.reduce((total, part) => total + part.length + 1, -1)

function stripPunctuation(token: string): string {
  return token.replace(/[^\p{L}\p{N}'-]/gu, '').toLowerCase()
}

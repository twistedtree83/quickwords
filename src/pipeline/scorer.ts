import type { Phrase } from './types'

/**
 * Turns raw text into scored phrases.
 *
 * Pure: no DOM, no canvas, no clock. Everything the Scorer knows is internal,
 * so the interface stays one function of one argument.
 */
export function score(text: string): Phrase[] {
  return text
    .split(/\s+/)
    .filter((token) => token.length > 0)
    .map((token) => ({
      words: [{ text: token, weight: 0, emphasis: false }],
      breakAfter: 'soft' as const,
    }))
}

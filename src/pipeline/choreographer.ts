import type { CompileOptions, Phrase, Preset, Timeline, TimelineEvent } from './types'

const FPS = 30
/** Time on screen a phrase earns for each word it carries. */
const PER_WORD_MS = 320
/** Even a one-word phrase needs long enough to register. */
const MIN_PHRASE_MS = 520

/** A full stop is a breath; a comma is a beat. */
const REST_MS: Record<Phrase['breakAfter'], number> = {
  hard: 420,
  soft: 180,
}

/**
 * Compiles scored phrases into absolute time.
 *
 * Pure and deterministic: it computes *when* things happen and never waits for
 * them. No clock access, so the same input always yields the same timeline.
 */
export function compile(
  phrases: Phrase[],
  _preset: Preset,
  _opts: CompileOptions,
): Timeline {
  const events: TimelineEvent[] = []
  let cursor = 0
  let wordId = 0

  phrases.forEach((phrase, phraseIndex) => {
    const phraseStart = cursor
    // The phrase shares one frame, so it takes one slot rather than one per
    // word — but a denser phrase earns proportionally longer to be read.
    const holdMs = Math.max(MIN_PHRASE_MS, phrase.words.length * PER_WORD_MS)

    for (const word of phrase.words) {
      events.push({
        wordId: wordId++,
        phraseIndex,
        text: word.text,
        emphasis: word.emphasis,
        onsetMs: phraseStart,
        holdMs,
        exitMs: phraseStart + holdMs,
      })
    }

    cursor = phraseStart + holdMs + REST_MS[phrase.breakAfter]
  })

  return { durationMs: cursor, fps: FPS, events }
}

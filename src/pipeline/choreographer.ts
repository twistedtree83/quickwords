import type { CompileOptions, Phrase, Preset, Timeline, TimelineEvent } from './types'

const FPS = 30
const FLAT_WORD_MS = 500

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
    for (const word of phrase.words) {
      events.push({
        wordId: wordId++,
        phraseIndex,
        text: word.text,
        emphasis: word.emphasis,
        onsetMs: cursor,
        holdMs: FLAT_WORD_MS,
        exitMs: cursor + FLAT_WORD_MS,
      })
      cursor += FLAT_WORD_MS
    }
  })

  return { durationMs: cursor, fps: FPS, events }
}

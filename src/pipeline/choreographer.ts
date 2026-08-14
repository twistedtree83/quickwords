import type { CompileOptions, Phrase, Preset, Timeline, TimelineEvent } from './types'

const FPS = 30

/** Two subdivisions to the beat: an emphasised word takes the whole beat. */
const SUBDIVISIONS_PER_BEAT = 2

const COST_IN_SUBDIVISIONS = {
  emphasised: SUBDIVISIONS_PER_BEAT,
  ordinary: 1,
} as const

/** Even a single quiet word needs long enough to register. */
const MIN_PHRASE_SUBDIVISIONS = 2

/** A full stop is a breath; a comma is a beat. */
const REST_IN_SUBDIVISIONS: Record<Phrase['breakAfter'], number> = {
  hard: 2,
  soft: 1,
}

/**
 * Compiles scored phrases into absolute time.
 *
 * Pure and deterministic: it computes *when* things happen and never waits for
 * them. No clock access, so the same input always yields the same timeline.
 *
 * Everything is counted in whole subdivisions of the tempo before being
 * converted to milliseconds, which is what keeps every onset on the grid
 * rather than merely near it.
 */
export function compile(
  phrases: Phrase[],
  _preset: Preset,
  opts: CompileOptions,
): Timeline {
  const subdivisionMs = 60_000 / opts.bpm / SUBDIVISIONS_PER_BEAT

  const events: TimelineEvent[] = []
  let cursorSubdivisions = 0
  let wordId = 0

  phrases.forEach((phrase, phraseIndex) => {
    const holdSubdivisions = Math.max(
      MIN_PHRASE_SUBDIVISIONS,
      phrase.words.reduce(
        (total, word) =>
          total +
          (word.emphasis
            ? COST_IN_SUBDIVISIONS.emphasised
            : COST_IN_SUBDIVISIONS.ordinary),
        0,
      ),
    )

    const onsetMs = cursorSubdivisions * subdivisionMs
    const holdMs = holdSubdivisions * subdivisionMs

    // The phrase shares one frame, so it takes one slot rather than one per
    // word — but a denser or more emphatic phrase earns longer to be read.
    for (const word of phrase.words) {
      events.push({
        wordId: wordId++,
        phraseIndex,
        text: word.text,
        emphasis: word.emphasis,
        onsetMs,
        holdMs,
        exitMs: onsetMs + holdMs,
      })
    }

    cursorSubdivisions +=
      holdSubdivisions + REST_IN_SUBDIVISIONS[phrase.breakAfter]
  })

  return {
    durationMs: cursorSubdivisions * subdivisionMs,
    fps: FPS,
    events,
  }
}

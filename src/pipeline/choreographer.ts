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

/** Beat of silence before the first phrase, so the video does not open mid-motion. */
const LEAD_IN_SUBDIVISIONS = 1

/** The last phrase holds, so a looping feed does not cut it off mid-word. */
const TAIL_SUBDIVISIONS = 3

/**
 * Platforms reject very short clips. A two-sentence post must not fail on
 * upload for being under the floor, so the closing hold absorbs the shortfall
 * rather than the pacing being distorted to fill it.
 */
export const MIN_VIDEO_MS = 3000

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
  let cursor = LEAD_IN_SUBDIVISIONS
  let wordId = 0

  phrases.forEach((phrase, phraseIndex) => {
    const isLast = phraseIndex === phrases.length - 1
    const hold =
      Math.max(
        MIN_PHRASE_SUBDIVISIONS,
        phrase.words.reduce(
          (total, word) =>
            total +
            (word.emphasis
              ? COST_IN_SUBDIVISIONS.emphasised
              : COST_IN_SUBDIVISIONS.ordinary),
          0,
        ),
      ) + (isLast ? TAIL_SUBDIVISIONS : 0)

    const onsetMs = cursor * subdivisionMs
    const holdMs = hold * subdivisionMs

    for (const word of phrase.words) {
      events.push({
        wordId: wordId++,
        phraseIndex,
        text: word.text,
        emphasis: word.emphasis,
        link: word.link,
        onsetMs,
        holdMs,
        exitMs: onsetMs + holdMs,
      })
    }

    cursor += hold + (isLast ? 0 : REST_IN_SUBDIVISIONS[phrase.breakAfter])
  })

  return {
    durationMs: clampToFloor(cursor * subdivisionMs, events),
    fps: FPS,
    events,
  }
}

/**
 * Extends the closing hold rather than the pacing, so a short post clears the
 * platform floor without every phrase being slowed to pad it out.
 */
function clampToFloor(durationMs: number, events: TimelineEvent[]): number {
  if (durationMs >= MIN_VIDEO_MS || events.length === 0) return durationMs

  const shortfall = MIN_VIDEO_MS - durationMs
  const lastPhrase = events[events.length - 1]!.phraseIndex

  for (const event of events) {
    if (event.phraseIndex !== lastPhrase) continue
    event.holdMs += shortfall
    event.exitMs += shortfall
  }

  return MIN_VIDEO_MS
}

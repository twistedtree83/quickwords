import { FRAME_HEIGHT, FRAME_WIDTH } from './frame'
import { setPhrase, sizeFor } from './layout'
import type {
  EasingFamily,
  Preset,
  Timeline,
  TimelineEvent,
  TransitionFamily,
} from './types'

/** How long a phrase takes to arrive, capped so short phrases still settle. */
const ENTRY_MS = 180
const ENTRY_SHARE_OF_HOLD = 0.35
/** How far a rising phrase travels, as a share of its own line height. */
const RISE_DISTANCE = 0.45

/**
 * Draws exactly one frame for one instant.
 *
 * Pure in everything that matters: the same `tMs` always produces the same
 * frame. It holds no animation state, owns no loop and reads no clock — whether
 * `tMs` comes from a real-time capture loop or a test counting by 33ms is not
 * its concern. Any state that accumulates across frames breaks this, and with
 * it every Renderer test.
 *
 * Every visual decision comes from the preset. The only thing branched on is
 * the transition *family* — never which preset this is.
 */
export function renderFrame(
  timeline: Timeline,
  tMs: number,
  ctx: CanvasRenderingContext2D,
  preset: Preset,
): void {
  ctx.fillStyle = preset.background
  ctx.fillRect(0, 0, FRAME_WIDTH, FRAME_HEIGHT)

  const phrase = wordsVisibleAt(timeline, tMs)
  if (phrase.length === 0) return

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const lines = setPhrase(phrase, preset, (text, fontPx, emphasis) => {
    const weight = emphasis ? preset.weightEmphasis : preset.weightOrdinary
    ctx.font = `${weight} ${fontPx}px ${preset.fontStack}`
    return ctx.measureText(text).width
  })

  const entry = entryProgress(phrase, tMs, preset)
  ctx.globalAlpha = alphaFor(preset.transition, entry)

  for (const line of lines) {
    const dy = offsetFor(preset.transition, entry, line.height)

    for (const word of line.words) {
      ctx.font = fontFor(word.event, word.fontPx, preset)
      ctx.fillStyle = word.event.emphasis ? preset.emphasisColor : preset.color
      ctx.fillText(word.text, word.x, line.y + dy)
    }
  }

  ctx.globalAlpha = 1
}

/** 0 at the instant a phrase appears, 1 once it has fully arrived. */
function entryProgress(
  phrase: TimelineEvent[],
  tMs: number,
  preset: Preset,
): number {
  const event = phrase[0]!
  const window = Math.min(ENTRY_MS, event.holdMs * ENTRY_SHARE_OF_HOLD)
  if (window <= 0) return 1

  const raw = Math.min(1, Math.max(0, (tMs - event.onsetMs) / window))
  return ease(preset.easing, raw)
}

const ease = (family: EasingFamily, t: number): number =>
  family === 'outCubic' ? 1 - (1 - t) ** 3 : t

const alphaFor = (family: TransitionFamily, entry: number): number =>
  family === 'cut' ? 1 : entry

const offsetFor = (
  family: TransitionFamily,
  entry: number,
  lineHeight: number,
): number =>
  family === 'rise' ? (1 - entry) * lineHeight * RISE_DISTANCE : 0

const fontFor = (event: TimelineEvent, fontPx: number, preset: Preset) =>
  `${event.emphasis ? preset.weightEmphasis : preset.weightOrdinary} ${fontPx}px ${preset.fontStack}`

/**
 * The words on screen at `tMs`. Derived from the timeline every call rather
 * than tracked across frames — that is what keeps the Renderer stateless.
 */
export function wordsVisibleAt(
  timeline: Timeline,
  tMs: number,
): TimelineEvent[] {
  const live = timeline.events.find(
    (event) => tMs >= event.onsetMs && tMs < event.exitMs,
  )
  if (!live) return []

  return timeline.events.filter(
    (event) => event.phraseIndex === live.phraseIndex,
  )
}

export { sizeFor }

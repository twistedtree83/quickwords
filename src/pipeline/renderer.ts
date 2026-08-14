import { FRAME_HEIGHT, FRAME_WIDTH, SAFE_HEIGHT, SAFE_WIDTH } from './frame'
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

  const scale = fittingScale(phrase, ctx, preset)
  const lines = phrase.map((event) => ({
    event,
    fontPx: sizeFor(event, preset, scale),
  }))

  const totalHeight = lines.reduce(
    (sum, line) => sum + line.fontPx * preset.lineHeightRatio,
    0,
  )
  const entry = entryProgress(phrase, tMs, preset)

  let top = FRAME_HEIGHT / 2 - totalHeight / 2

  for (const { event, fontPx } of lines) {
    const lineHeight = fontPx * preset.lineHeightRatio

    ctx.globalAlpha = alphaFor(preset.transition, entry)
    ctx.font = fontFor(event, fontPx, preset)
    ctx.fillStyle = event.emphasis ? preset.emphasisColor : preset.color
    ctx.fillText(
      event.text,
      FRAME_WIDTH / 2,
      top + lineHeight / 2 + offsetFor(preset.transition, entry, lineHeight),
    )

    top += lineHeight
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

const sizeFor = (event: TimelineEvent, preset: Preset, scale: number) =>
  (event.emphasis ? preset.baseFontPx * preset.emphasisScale : preset.baseFontPx) *
  scale

const fontFor = (event: TimelineEvent, fontPx: number, preset: Preset) =>
  `${event.emphasis ? preset.weightEmphasis : preset.weightOrdinary} ${fontPx}px ${preset.fontStack}`

/**
 * How far the whole phrase has to shrink to fit the safe area.
 *
 * Solved for the phrase as a unit rather than per word, so relative emphasis
 * survives the shrink — a long word does not flatten the size difference that
 * makes emphasis readable.
 */
function fittingScale(
  phrase: TimelineEvent[],
  ctx: CanvasRenderingContext2D,
  preset: Preset,
): number {
  let widest = 0
  for (const event of phrase) {
    ctx.font = fontFor(event, sizeFor(event, preset, 1), preset)
    widest = Math.max(widest, ctx.measureText(event.text).width)
  }

  const tallest = phrase.reduce(
    (sum, event) => sum + sizeFor(event, preset, 1) * preset.lineHeightRatio,
    0,
  )

  const horizontal = widest === 0 ? 1 : SAFE_WIDTH / widest
  const vertical = tallest === 0 ? 1 : SAFE_HEIGHT / tallest

  // Never scale *up* — the preset's base size is the intended size.
  return Math.min(1, horizontal, vertical)
}

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

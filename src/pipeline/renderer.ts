import {
  FRAME_HEIGHT,
  FRAME_WIDTH,
  SAFE_HEIGHT,
  SAFE_WIDTH,
} from './frame'
import {
  BASE_FONT_PX,
  EMPHASIS_SCALE,
  LINE_HEIGHT_RATIO,
  MIN_FONT_PX,
} from './typography'
import type { Preset, Timeline, TimelineEvent } from './types'

/**
 * Draws exactly one frame for one instant.
 *
 * Pure in everything that matters: the same `tMs` always produces the same
 * frame. It holds no animation state, owns no loop and reads no clock — whether
 * `tMs` comes from a real-time capture loop or a test counting by 33ms is not
 * its concern. Any state that accumulates across frames breaks this, and with
 * it every Renderer test.
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
    fontPx: sizeFor(event, scale),
  }))

  const totalHeight = lines.reduce(
    (sum, line) => sum + line.fontPx * LINE_HEIGHT_RATIO,
    0,
  )
  let top = FRAME_HEIGHT / 2 - totalHeight / 2

  for (const { event, fontPx } of lines) {
    const lineHeight = fontPx * LINE_HEIGHT_RATIO
    ctx.font = fontFor(event, fontPx, preset)
    ctx.fillStyle = event.emphasis ? preset.emphasisColor : preset.color
    ctx.fillText(event.text, FRAME_WIDTH / 2, top + lineHeight / 2)
    top += lineHeight
  }
}

const sizeFor = (event: TimelineEvent, scale: number) =>
  (event.emphasis ? BASE_FONT_PX * EMPHASIS_SCALE : BASE_FONT_PX) * scale

const fontFor = (event: TimelineEvent, fontPx: number, preset: Preset) =>
  `${event.emphasis ? '700' : '400'} ${fontPx}px ${preset.fontStack}`

/**
 * How far the whole phrase has to shrink to fit the safe area.
 *
 * Solved for the phrase as a unit rather than per word, so relative emphasis
 * survives the shrink — a long word does not flatten the size difference that
 * makes emphasis readable. A single unbreakable token (a URL) simply scales
 * further down; below the legible floor it is allowed to stay legible and
 * overflow is prevented by the horizontal solve alone.
 */
function fittingScale(
  phrase: TimelineEvent[],
  ctx: CanvasRenderingContext2D,
  preset: Preset,
): number {
  let widest = 0
  for (const event of phrase) {
    const fontPx = sizeFor(event, 1)
    ctx.font = fontFor(event, fontPx, preset)
    widest = Math.max(widest, ctx.measureText(event.text).width)
  }

  const tallest = phrase.reduce(
    (sum, event) => sum + sizeFor(event, 1) * LINE_HEIGHT_RATIO,
    0,
  )

  const horizontal = widest === 0 ? 1 : SAFE_WIDTH / widest
  const vertical = tallest === 0 ? 1 : SAFE_HEIGHT / tallest

  // Never scale *up* — the base size is the intended size.
  return Math.min(1, horizontal, vertical)
}

/**
 * The words on screen at `tMs`. Derived from the timeline every call rather
 * than tracked across frames — that is what keeps the Renderer stateless.
 */
export function wordsVisibleAt(timeline: Timeline, tMs: number): TimelineEvent[] {
  const live = timeline.events.find(
    (event) => tMs >= event.onsetMs && tMs < event.exitMs,
  )
  if (!live) return []

  return timeline.events.filter(
    (event) => event.phraseIndex === live.phraseIndex,
  )
}

export { MIN_FONT_PX }

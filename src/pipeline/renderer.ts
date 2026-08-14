import { FRAME_HEIGHT, FRAME_WIDTH } from './frame'
import type { Preset, Timeline, TimelineEvent } from './types'

const BASE_FONT_PX = 120
/** Emphasis has to survive being seen on a phone, in a feed, while scrolling. */
const EMPHASIS_SCALE = 1.4

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

  const lines = phrase.map((event) => ({
    event,
    fontPx: event.emphasis ? BASE_FONT_PX * EMPHASIS_SCALE : BASE_FONT_PX,
  }))

  const totalHeight = lines.reduce((sum, line) => sum + line.fontPx * 1.2, 0)
  let baseline = FRAME_HEIGHT / 2 - totalHeight / 2

  for (const { event, fontPx } of lines) {
    const lineHeight = fontPx * 1.2
    ctx.font = `${event.emphasis ? '700 ' : '400 '}${fontPx}px ${preset.fontStack}`
    ctx.fillStyle = event.emphasis ? preset.emphasisColor : preset.color
    ctx.fillText(event.text, FRAME_WIDTH / 2, baseline + lineHeight / 2)
    baseline += lineHeight
  }
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

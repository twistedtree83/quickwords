import { FRAME_HEIGHT, FRAME_WIDTH } from './frame'
import type { Preset, Timeline, TimelineEvent } from './types'

const BASE_FONT_PX = 120

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

  ctx.font = `${BASE_FONT_PX}px ${preset.fontStack}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const lineHeight = BASE_FONT_PX * 1.2
  const top = FRAME_HEIGHT / 2 - ((phrase.length - 1) * lineHeight) / 2

  phrase.forEach((event, index) => {
    ctx.fillStyle = event.emphasis ? preset.emphasisColor : preset.color
    ctx.fillText(event.text, FRAME_WIDTH / 2, top + index * lineHeight)
  })
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

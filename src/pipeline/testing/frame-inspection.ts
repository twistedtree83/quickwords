import { AVERAGE_GLYPH_WIDTH } from '../typography'
import { fontPxFrom } from './font-string'
import type { DrawCall } from './recording-context'

export type GlyphBox = {
  text: string
  fontPx: number
  left: number
  right: number
  y: number
}

/**
 * Reconstructs what was actually put on the frame: for each fillText, the font
 * in force at that moment and the box the centred text occupies.
 *
 * Every word is drawn with `textAlign = 'center'` at its own centre, so a box
 * is derived from that centre regardless of how words are arranged on a line.
 */
export function drawnBoxes(calls: DrawCall[]): GlyphBox[] {
  let fontPx = 0
  const boxes: GlyphBox[] = []

  for (const call of calls) {
    if (call.op === 'set:font') {
      fontPx = fontPxFrom(call.args[0])
      continue
    }
    if (call.op !== 'fillText') continue

    const text = String(call.args[0])
    const x = Number(call.args[1])
    const width = text.length * fontPx * AVERAGE_GLYPH_WIDTH

    boxes.push({
      text,
      fontPx,
      left: x - width / 2,
      right: x + width / 2,
      y: Number(call.args[2]),
    })
  }

  return boxes
}

/** Words sharing a baseline are on the same line. */
export function linesOf(boxes: GlyphBox[]): GlyphBox[][] {
  const byBaseline = new Map<number, GlyphBox[]>()

  for (const box of boxes) {
    const line = byBaseline.get(box.y) ?? []
    line.push(box)
    byBaseline.set(box.y, line)
  }

  return [...byBaseline.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, line]) => line)
}

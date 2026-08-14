import { describe, expect, it } from 'vitest'
import { score } from './scorer'
import { compile } from './choreographer'
import { renderFrame } from './renderer'
import { DEFAULT_PRESET } from './presets'
import { recordingContext, type DrawCall } from './testing/recording-context'
import {
  FRAME_HEIGHT,
  FRAME_WIDTH,
  SAFE_BOTTOM,
  SAFE_LEFT,
  SAFE_RIGHT,
  SAFE_TOP,
  SAFE_WIDTH,
} from './frame'
import { AVERAGE_GLYPH_WIDTH } from './typography'
import { fontPxFrom } from './testing/font-string'

/**
 * Reconstructs what was actually put on the frame: for each fillText, the font
 * in force at that moment and the box the centred text occupies.
 */
function drawnBoxes(calls: DrawCall[]) {
  let fontPx = 0
  const boxes: Array<{ text: string; left: number; right: number; y: number }> =
    []

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
      left: x - width / 2,
      right: x + width / 2,
      y: Number(call.args[2]),
    })
  }

  return boxes
}

const framesAcross = (text: string) => {
  const timeline = compile(score(text), DEFAULT_PRESET, { bpm: 120 })
  const step = Math.max(1, Math.floor(timeline.durationMs / 40))
  const boxes = []

  for (let t = 0; t < timeline.durationMs; t += step) {
    const { ctx, calls } = recordingContext()
    renderFrame(timeline, t, ctx, DEFAULT_PRESET)
    boxes.push(...drawnBoxes(calls))
  }

  return boxes
}

describe('nothing is drawn outside the safe area', () => {
  const samples = [
    'a perfectly ordinary sentence about shipping software',
    'we cut the build from 11 minutes to 40 seconds flat',
    `read it here https://example.com/${'a'.repeat(180)}`,
    'antidisestablishmentarianism',
    'café naïve résumé 🚀 shipped',
  ]

  it.each(samples)('keeps every glyph inside the margins for: %s', (text) => {
    for (const box of framesAcross(text)) {
      expect(box.left).toBeGreaterThanOrEqual(SAFE_LEFT)
      expect(box.right).toBeLessThanOrEqual(SAFE_RIGHT)
      expect(box.y).toBeGreaterThanOrEqual(SAFE_TOP)
      expect(box.y).toBeLessThanOrEqual(SAFE_BOTTOM)
    }
  })

  it('shrinks an unbreakable token until it fits rather than clipping it', () => {
    const url = `https://example.com/${'a'.repeat(180)}`
    const boxes = framesAcross(url)

    expect(boxes.length).toBeGreaterThan(0)
    for (const box of boxes) {
      expect(box.right - box.left).toBeLessThanOrEqual(SAFE_WIDTH)
    }
  })

  it('leaves a real margin rather than filling the frame edge to edge', () => {
    expect(SAFE_LEFT).toBeGreaterThan(0)
    expect(SAFE_RIGHT).toBeLessThan(FRAME_WIDTH)
    expect(SAFE_TOP).toBeGreaterThan(0)
    expect(SAFE_BOTTOM).toBeLessThan(FRAME_HEIGHT)
  })
})

describe('every word gets its moment', () => {
  it('draws each word at some point across a full sweep', () => {
    const text = 'we cut the build from 11 minutes to 40 seconds flat'
    const drawn = new Set(framesAcross(text).map((box) => box.text))

    for (const word of text.split(' ')) {
      expect(drawn).toContain(word)
    }
  })
})

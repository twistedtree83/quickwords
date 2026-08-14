import { describe, expect, it } from 'vitest'
import { score } from './scorer'
import { compile } from './choreographer'
import { renderFrame } from './renderer'
import { DEFAULT_PRESET } from './presets'
import { recordingContext } from './testing/recording-context'

const timelineFor = (text: string) =>
  compile(score(text), DEFAULT_PRESET, { bpm: 120 })

const frameAt = (text: string, tMs: number) => {
  const { ctx, calls } = recordingContext()
  renderFrame(timelineFor(text), tMs, ctx, DEFAULT_PRESET)
  return calls
}

describe('the Renderer makes emphasis visible', () => {
  const drawSingleWord = (emphasis: boolean) => {
    const timeline = compile(
      [{ words: [{ text: 'alpha', weight: 1, emphasis }], breakAfter: 'soft' }],
      DEFAULT_PRESET,
      { bpm: 120 },
    )
    const { ctx, calls } = recordingContext()
    renderFrame(timeline, 10, ctx, DEFAULT_PRESET)
    return calls
  }

  const largestFontPx = (calls: ReturnType<typeof drawSingleWord>) =>
    Math.max(
      ...calls
        .filter((call) => call.op === 'set:font')
        .map((call) => Number.parseFloat(String(call.args[0]))),
    )

  it('draws an emphasised word differently from a plain one', () => {
    expect(drawSingleWord(true)).not.toEqual(drawSingleWord(false))
  })

  it('draws an emphasised word larger, so it reads on a phone', () => {
    expect(largestFontPx(drawSingleWord(true))).toBeGreaterThan(
      largestFontPx(drawSingleWord(false)),
    )
  })
})

describe('the Renderer holds no state between frames', () => {
  it('draws an identical frame for the same timestamp', () => {
    expect(frameAt('hello world', 250)).toEqual(frameAt('hello world', 250))
  })

  it('draws the same frame whether timestamps arrive in order or shuffled', () => {
    const timeline = timelineFor('one two three four')
    const timestamps = [0, 250, 600, 900, 1400, 1800]

    const inOrder = new Map<number, unknown>()
    for (const t of timestamps) {
      const { ctx, calls } = recordingContext()
      renderFrame(timeline, t, ctx, DEFAULT_PRESET)
      inOrder.set(t, calls)
    }

    const shuffled = [1400, 0, 900, 250, 1800, 600]
    for (const t of shuffled) {
      const { ctx, calls } = recordingContext()
      renderFrame(timeline, t, ctx, DEFAULT_PRESET)
      expect(calls).toEqual(inOrder.get(t))
    }
  })
})

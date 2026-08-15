import { describe, expect, it } from 'vitest'
import { score } from './scorer'
import { compile } from './choreographer'
import { renderFrame } from './renderer'
import { DEFAULT_PRESET } from './presets'
import { recordingContext } from './testing/recording-context'
import { drawnBoxes, linesOf } from './testing/frame-inspection'
import { SAFE_WIDTH } from './frame'

const firstPhraseFrame = (text: string) => {
  const timeline = compile(score(text), DEFAULT_PRESET, { bpm: 120 })
  const first = timeline.events[0]!
  const { ctx, calls } = recordingContext()
  renderFrame(timeline, first.onsetMs + first.holdMs / 2, ctx, DEFAULT_PRESET)
  return drawnBoxes(calls)
}

describe('a word is never split across lines', () => {
  const LONG_TOKEN = `https://example.com/${'a'.repeat(180)}`

  it('draws an unbreakable token as one whole piece', () => {
    const drawn = firstPhraseFrame(LONG_TOKEN).map((box) => box.text)

    expect(drawn).toContain(LONG_TOKEN)
  })

  it('shrinks it to fit rather than breaking it', () => {
    for (const box of firstPhraseFrame(LONG_TOKEN)) {
      expect(box.right - box.left).toBeLessThanOrEqual(SAFE_WIDTH)
    }
  })

  it('keeps every ordinary word whole too', () => {
    const text = 'antidisestablishmentarianism beats brevity occasionally'
    const drawn = firstPhraseFrame(text).map((box) => box.text)

    expect(drawn).toContain('antidisestablishmentarianism')
  })
})

describe('a phrase is set as type, not stacked one word per line', () => {
  it('puts more than one word on a line when they fit', () => {
    const boxes = firstPhraseFrame('we cut the build from 11 minutes')
    const lines = linesOf(boxes)

    expect(boxes.length).toBeGreaterThan(1)
    expect(lines.length).toBeLessThan(boxes.length)
  })

  it('uses most of the width it is given', () => {
    const boxes = firstPhraseFrame('we cut the build from 11 minutes')
    const widest = Math.max(
      ...linesOf(boxes).map(
        (line) =>
          Math.max(...line.map((b) => b.right)) -
          Math.min(...line.map((b) => b.left)),
      ),
    )

    expect(widest).toBeGreaterThan(SAFE_WIDTH * 0.5)
  })

  it('scales a short phrase up rather than leaving it small in the frame', () => {
    const short = firstPhraseFrame('ship it')
    const long = firstPhraseFrame(
      'we cut the build from eleven minutes to forty seconds',
    )

    const biggest = (boxes: ReturnType<typeof drawnBoxes>) =>
      Math.max(...boxes.map((b) => b.fontPx))

    expect(biggest(short)).toBeGreaterThan(biggest(long))
  })

  it('keeps an emphasised word larger than its neighbours', () => {
    // Kept short so the number and its neighbour share the first phrase.
    const boxes = firstPhraseFrame('cut to 40 seconds')
    const number = boxes.find((b) => b.text === '40')
    const ordinary = boxes.find((b) => b.text === 'cut')

    expect(number).toBeDefined()
    expect(ordinary).toBeDefined()
    expect(number!.fontPx).toBeGreaterThan(ordinary!.fontPx)
  })
})

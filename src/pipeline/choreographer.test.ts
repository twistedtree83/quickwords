import { describe, expect, it } from 'vitest'
import { score } from './scorer'
import { compile } from './choreographer'
import { DEFAULT_PRESET } from './presets'

const timelineFor = (text: string, bpm = 120) =>
  compile(score(text), DEFAULT_PRESET, { bpm })

describe('the Choreographer lays words out in time', () => {
  it('gives every word an onset', () => {
    const text = 'every single word needs a moment'
    const timeline = timelineFor(text)

    expect(timeline.events).toHaveLength(text.split(' ').length)
    for (const event of timeline.events) {
      expect(Number.isFinite(event.onsetMs)).toBe(true)
    }
  })

  it('produces onsets that only ever move forward', () => {
    const onsets = timelineFor('one two three four five six').events.map(
      (event) => event.onsetMs,
    )
    const sorted = [...onsets].sort((a, b) => a - b)

    expect(onsets).toEqual(sorted)
  })

  it('never ends before its last word leaves the screen', () => {
    const timeline = timelineFor('a slightly longer line of text here')
    const lastExit = Math.max(...timeline.events.map((event) => event.exitMs))

    expect(timeline.durationMs).toBeGreaterThanOrEqual(lastExit)
  })
})

describe('the Choreographer is deterministic', () => {
  it('compiles the same timeline for the same input and tempo', () => {
    expect(timelineFor('ship it then measure it')).toEqual(
      timelineFor('ship it then measure it'),
    )
  })
})

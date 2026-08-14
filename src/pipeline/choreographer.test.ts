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

describe('a phrase stays up long enough to read', () => {
  const displayMs = (text: string) => {
    const first = timelineFor(text).events.filter((e) => e.phraseIndex === 0)
    return first[0]!.exitMs - first[0]!.onsetMs
  }

  it('holds a phrase with more words on screen for longer', () => {
    expect(displayMs('one two three four five')).toBeGreaterThan(
      displayMs('one two'),
    )
  })
})

describe('punctuation buys rest', () => {
  const restAfterFirstPhrase = (text: string) => {
    const timeline = timelineFor(text)
    const first = timeline.events.filter((e) => e.phraseIndex === 0)
    const second = timeline.events.filter((e) => e.phraseIndex === 1)

    return (
      Math.min(...second.map((e) => e.onsetMs)) -
      Math.max(...first.map((e) => e.exitMs))
    )
  }

  it('rests after a phrase rather than running straight on', () => {
    expect(restAfterFirstPhrase('ship it, measure it')).toBeGreaterThan(0)
  })

  it('rests longer after a full stop than after a comma', () => {
    expect(restAfterFirstPhrase('ship it. measure it')).toBeGreaterThan(
      restAfterFirstPhrase('ship it, measure it'),
    )
  })
})

describe('the Choreographer is deterministic', () => {
  it('compiles the same timeline for the same input and tempo', () => {
    expect(timelineFor('ship it then measure it')).toEqual(
      timelineFor('ship it then measure it'),
    )
  })
})

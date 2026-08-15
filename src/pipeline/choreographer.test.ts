import { describe, expect, it } from 'vitest'
import { score } from './scorer'
import { compile, MIN_VIDEO_MS } from './choreographer'
import { DEFAULT_PRESET } from './presets'
import type { Phrase } from './types'

const timelineFor = (text: string, bpm = 120) =>
  compile(score(text), DEFAULT_PRESET, { bpm })

/** Hand-built phrases, so Choreographer tests do not depend on the Scorer. */
const phrase = (
  words: Array<[text: string, emphasis: boolean]>,
  breakAfter: Phrase['breakAfter'] = 'soft',
): Phrase => ({
  words: words.map(([text, emphasis]) => ({
    text,
    weight: emphasis ? 1 : 0.3,
    emphasis,
    link: false,
  })),
  breakAfter,
})

const compilePhrases = (phrases: Phrase[], bpm = 120) =>
  compile(phrases, DEFAULT_PRESET, { bpm })

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

  // Measured on phrase 0 of a multi-phrase fixture: the closing tail-hold and
  // the platform-minimum clamp both land on the *last* phrase, and would
  // otherwise equalise two short fixtures and hide the difference.
  it('holds a phrase with more words on screen for longer', () => {
    expect(displayMs('one two three four five. a trailing sentence.')).toBeGreaterThan(
      displayMs('one two. a trailing sentence.'),
    )
  })
})

describe('emphasis buys time', () => {
  it('holds a phrase carrying an emphasised word longer than one without', () => {
    const holdOfFirst = (emphasis: boolean) =>
      compilePhrases([
        phrase([
          ['alpha', emphasis],
          ['beta', false],
        ]),
        phrase([['trailing', false]]),
      ]).events[0]!.holdMs

    expect(holdOfFirst(true)).toBeGreaterThan(holdOfFirst(false))
  })
})

describe('onsets land on the beat grid', () => {
  it('places every onset on a subdivision of the tempo', () => {
    const bpm = 120
    const subdivisionMs = 60_000 / bpm / 2

    const timeline = compilePhrases(
      [
        phrase([['one', true]], 'hard'),
        phrase([
          ['two', false],
          ['three', true],
        ]),
        phrase([['four', false]], 'hard'),
      ],
      bpm,
    )

    for (const event of timeline.events) {
      expect(event.onsetMs % subdivisionMs).toBe(0)
    }
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

describe('tempo drives pace', () => {
  it('makes every step up in tempo produce a shorter video', () => {
    const text = 'we cut the build from 11 minutes to 40 seconds. nobody asked.'
    const durations = [60, 90, 120, 150, 180].map(
      (bpm) => timelineFor(text, bpm).durationMs,
    )

    for (let i = 1; i < durations.length; i++) {
      expect(durations[i]!).toBeLessThan(durations[i - 1]!)
    }
  })
})

describe('the video is long enough to post', () => {
  it('clamps a very short input above the platform minimum', () => {
    expect(timelineFor('Ship it.').durationMs).toBeGreaterThanOrEqual(
      MIN_VIDEO_MS,
    )
  })

  it('does not stretch an already long enough video', () => {
    const long = timelineFor(
      'we cut the build from eleven minutes down to forty seconds. nobody asked us to do it. the support queue is quieter now.',
    )
    const words = long.events.length

    expect(long.durationMs).toBeGreaterThan(MIN_VIDEO_MS)
    expect(long.durationMs).toBeLessThan(words * 4000)
  })
})

describe('the video does not begin or end mid-motion', () => {
  const timeline = timelineFor('ship it. then measure it.')

  it('leads in before the first word appears', () => {
    const firstOnset = Math.min(...timeline.events.map((e) => e.onsetMs))
    expect(firstOnset).toBeGreaterThan(0)
  })

  it('still has words on screen at the final moment', () => {
    const stillUp = timeline.events.filter(
      (event) =>
        timeline.durationMs - 1 >= event.onsetMs &&
        timeline.durationMs - 1 < event.exitMs,
    )

    expect(stillUp.length).toBeGreaterThan(0)
  })
})

describe('the Choreographer is deterministic', () => {
  it('compiles the same timeline for the same input and tempo', () => {
    expect(timelineFor('ship it then measure it')).toEqual(
      timelineFor('ship it then measure it'),
    )
  })
})

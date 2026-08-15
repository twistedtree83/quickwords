import { describe, expect, it } from 'vitest'
import { score } from './scorer'
import { compile } from './choreographer'
import { renderFrame } from './renderer'
import { DEFAULT_PRESET } from './presets'
import { isLink } from './links'
import { recordingContext } from './testing/recording-context'

describe('a link is recognised', () => {
  it.each([
    'https://example.com/writeup',
    'http://example.com',
    'www.example.com',
    'https://example.com/a/very/long/path?with=query#and-hash',
  ])('treats %s as a link', (token) => {
    expect(isLink(token)).toBe(true)
  })

  it.each(['shipping', 'e.g.', '40', 'co-founder', 'hello.world'])(
    'does not treat %s as a link',
    (token) => {
      expect(isLink(token)).toBe(false)
    },
  )
})

describe('the Scorer marks links on the word', () => {
  it('flags a URL and leaves ordinary words alone', () => {
    const words = score('read it at https://example.com/writeup today').flatMap(
      (phrase) => phrase.words,
    )

    expect(words.find((w) => w.text.startsWith('https://'))!.link).toBe(true)
    expect(words.find((w) => w.text === 'today')!.link).toBe(false)
  })
})

describe('links are underlined, since canvas has no text-decoration', () => {
  const fillRects = (text: string) => {
    const timeline = compile(score(text), DEFAULT_PRESET, { bpm: 120 })
    const first = timeline.events[0]!
    const { ctx, calls } = recordingContext()
    renderFrame(timeline, first.onsetMs + first.holdMs / 2, ctx, DEFAULT_PRESET)
    return calls.filter((call) => call.op === 'fillRect')
  }

  it('draws a rule under a link, on top of the background fill', () => {
    // The background is itself a fillRect, so a link must add at least one more.
    expect(fillRects('https://example.com/writeup').length).toBeGreaterThan(
      fillRects('shipping beats polishing').length,
    )
  })

  it('draws no rule when there is no link', () => {
    expect(fillRects('shipping beats polishing')).toHaveLength(1)
  })
})

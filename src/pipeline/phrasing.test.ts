import { describe, expect, it } from 'vitest'
import { score } from './scorer'
import { MAX_PHRASE_CHARS, MAX_PHRASE_WORDS } from './budget'

const shape = (text: string) =>
  score(text).map((phrase) => ({
    text: phrase.words.map((word) => word.text).join(' '),
    breakAfter: phrase.breakAfter,
  }))

const charsIn = (text: string) => text.length

describe('phrases break at punctuation', () => {
  it('ends a phrase at a full stop and marks the break hard', () => {
    expect(shape('ship it. measure it.')).toEqual([
      { text: 'ship it.', breakAfter: 'hard' },
      { text: 'measure it.', breakAfter: 'hard' },
    ])
  })

  it('ends a phrase at a comma and marks the break soft', () => {
    expect(shape('ship it, then measure')).toEqual([
      { text: 'ship it,', breakAfter: 'soft' },
      { text: 'then measure', breakAfter: 'soft' },
    ])
  })

  it('treats question and exclamation marks as hard breaks', () => {
    const breaks = score('does it work? it does!').map((p) => p.breakAfter)
    expect(breaks).toEqual(['hard', 'hard'])
  })
})

describe('phrases break before conjunctions', () => {
  it('starts a new phrase at a coordinating conjunction', () => {
    expect(shape('we shipped it and nobody noticed')).toEqual([
      { text: 'we shipped it', breakAfter: 'soft' },
      { text: 'and nobody noticed', breakAfter: 'soft' },
    ])
  })

  it('does not break on a conjunction that opens the text', () => {
    expect(shape('and it worked perfectly')).toEqual([
      { text: 'and it worked perfectly', breakAfter: 'soft' },
    ])
  })
})

describe('phrases stay inside the budget', () => {
  const unpunctuated =
    'this is a very long sentence with no punctuation at all so it must be broken by budget'

  it('breaks text that would otherwise overflow the frame', () => {
    expect(score(unpunctuated).length).toBeGreaterThan(1)
  })

  it('never lets a phrase exceed the character budget', () => {
    for (const phrase of shape(unpunctuated)) {
      expect(charsIn(phrase.text)).toBeLessThanOrEqual(MAX_PHRASE_CHARS)
    }
  })

  it('never lets a phrase exceed the word budget', () => {
    for (const phrase of score(unpunctuated)) {
      expect(phrase.words.length).toBeLessThanOrEqual(MAX_PHRASE_WORDS)
    }
  })

  it('keeps a single over-long token rather than dropping it', () => {
    const url = `https://example.com/${'a'.repeat(180)}`
    const words = score(url).flatMap((p) => p.words.map((w) => w.text))

    expect(words).toEqual([url])
  })
})

describe('some spans are never split', () => {
  const phraseIndexOf = (text: string, word: string) =>
    score(text).findIndex((phrase) => phrase.words.some((w) => w.text === word))

  it('keeps a quoted span in a single phrase', () => {
    const text = 'she said "the whole thing was broken" and left'
    const quoted = score(text).filter((phrase) =>
      phrase.words.some((word) => /["“”]/.test(word.text)),
    )

    expect(quoted).toHaveLength(1)
  })

  it('keeps a multi-word proper noun together', () => {
    // Chosen so the word budget would otherwise fall between the two.
    const text = 'we all went to New York'

    expect(phraseIndexOf(text, 'New')).toBe(phraseIndexOf(text, 'York'))
  })

  it('keeps a hyphenated compound as one word', () => {
    const words = score('a state-of-the-art pipeline').flatMap((p) =>
      p.words.map((w) => w.text),
    )

    expect(words).toContain('state-of-the-art')
  })

  it('leaves a short sentence that already fits as a single phrase', () => {
    expect(score('Shipping beats polishing')).toHaveLength(1)
  })
})

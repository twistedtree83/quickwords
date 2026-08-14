import { describe, expect, it } from 'vitest'
import { score } from './scorer'

const emphasised = (text: string) =>
  score(text).flatMap((phrase) =>
    phrase.words.filter((word) => word.emphasis).map((word) => word.text),
  )

const allWords = (text: string) =>
  score(text).flatMap((phrase) => phrase.words)

describe('the quantitative claim always lands', () => {
  it('emphasises a bare number', () => {
    expect(emphasised('we shipped 47 features last quarter')).toContain('47')
  })

  it('emphasises a currency amount', () => {
    expect(emphasised('it saved us $12,000 a year')).toContain('$12,000')
  })

  it('emphasises a percentage', () => {
    expect(emphasised('conversion rose 23% overnight')).toContain('23%')
  })
})

describe('connective tissue never gets a beat', () => {
  it.each(['the', 'of', 'was', 'in', 'a', 'to', 'and', 'is', 'it'])(
    'never emphasises %s',
    (stopword) => {
      const text =
        'the cost of the thing was in a state and it is to be expected'
      expect(emphasised(text)).not.toContain(stopword)
    },
  )
})

describe('weights are usable numbers', () => {
  it('gives every word a weight between 0 and 1', () => {
    for (const word of allWords('the team shipped 12 features in April')) {
      expect(word.weight).toBeGreaterThanOrEqual(0)
      expect(word.weight).toBeLessThanOrEqual(1)
    }
  })

  it('weighs a number above a stopword', () => {
    const words = allWords('we shipped 47 of them')
    const number = words.find((w) => w.text === '47')!
    const stopword = words.find((w) => w.text === 'of')!

    expect(number.weight).toBeGreaterThan(stopword.weight)
  })

  it('does not emphasise every word in an ordinary sentence', () => {
    const text = 'we spent the afternoon rewriting the export pipeline'
    const words = allWords(text)
    const emphasisedCount = words.filter((w) => w.emphasis).length

    expect(emphasisedCount).toBeGreaterThan(0)
    expect(emphasisedCount).toBeLessThan(words.length)
  })
})

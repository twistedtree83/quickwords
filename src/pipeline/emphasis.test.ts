import { describe, expect, it } from 'vitest'
import { score } from './scorer'

const emphasised = (text: string) =>
  score(text).flatMap((phrase) =>
    phrase.words.filter((word) => word.emphasis).map((word) => word.text),
  )

const allWords = (text: string) => score(text).flatMap((phrase) => phrase.words)

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

describe('the author outranks the machine', () => {
  it('always emphasises an asterisk-wrapped word', () => {
    expect(emphasised('we shipped *quietly* last week')).toContain('quietly')
  })

  it('strips the asterisks from the word that gets drawn', () => {
    const words = allWords('we shipped *quietly* last week').map((w) => w.text)

    expect(words).toContain('quietly')
    expect(words.join(' ')).not.toContain('*')
  })

  it('emphasises an asterisk-wrapped stopword, beating suppression', () => {
    expect(emphasised('it was *the* problem all along')).toContain('the')
  })

  it('emphasises an ALL CAPS word and keeps its casing', () => {
    expect(emphasised('this was NOT the plan')).toContain('NOT')
  })

  it('emphasises the words inside a quoted span', () => {
    const words = emphasised('he called it "completely unusable" afterwards')

    expect(words).toContain('"completely')
    expect(words).toContain('unusable"')
  })
})

describe('malformed author signals degrade gracefully', () => {
  it('leaves a stray asterisk as ordinary text', () => {
    const words = allWords('a * b').map((w) => w.text)

    expect(words).toEqual(['a', '*', 'b'])
  })

  it('does not lose words when a quote is never closed', () => {
    const words = allWords('he said "it broke and then left').map((w) => w.text)

    expect(words).toEqual(['he', 'said', '"it', 'broke', 'and', 'then', 'left'])
  })

  it('does not emphasise an unclosed quoted run', () => {
    expect(emphasised('he said "it broke and then left')).not.toContain('"it')
  })

  it('does not treat a single capital letter as shouting', () => {
    expect(emphasised('I shipped a thing')).not.toContain('I')
  })
})

describe('quotation emphasises the span, not every word in it', () => {
  it('skips stopwords inside a quoted span', () => {
    const words = emphasised(
      'he called it "completely unusable on a phone" afterwards',
    )

    expect(words).toContain('unusable')
    expect(words).not.toContain('on')
    expect(words).not.toContain('a')
  })
})

describe('a number stays with what it measures', () => {
  const phraseIndexOf = (text: string, word: string) =>
    score(text).findIndex((phrase) =>
      phrase.words.some((w) => w.text === word),
    )

  it('keeps a number and its unit in the same phrase', () => {
    const text = 'we cut it down from 11 minutes to 40 seconds'

    expect(phraseIndexOf(text, '40')).toBe(phraseIndexOf(text, 'seconds'))
  })

  it('keeps a count with the noun it counts', () => {
    const text = 'the team reviewed all 47 pull requests before lunch'

    expect(phraseIndexOf(text, '47')).toBe(phraseIndexOf(text, 'pull'))
  })
})

describe('prose without numbers still finds its anchors', () => {
  const numberless =
    'nobody tells you that the hardest part of shipping is deciding what not to build and then living with that decision every day'

  const rateFor = (text: string) => {
    const words = allWords(text)
    return words.filter((word) => word.emphasis).length / words.length
  }

  it('does not leave numberless prose almost entirely flat', () => {
    expect(rateFor(numberless)).toBeGreaterThan(0.1)
  })

  it('still does not emphasise most of the sentence', () => {
    expect(rateFor(numberless)).toBeLessThan(0.45)
  })
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

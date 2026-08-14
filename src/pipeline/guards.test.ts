import { describe, expect, it } from 'vitest'
import {
  MAX_INPUT_WORDS,
  canRecord,
  describeProblem,
  isRightToLeft,
  isTooLong,
} from './guards'

describe('recording support is checked, not assumed', () => {
  it('reports a browser with no MediaRecorder as unable', () => {
    expect(canRecord({})).toBe(false)
  })

  it('reports a browser with no canvas capture as unable', () => {
    expect(canRecord({ MediaRecorder: function () {} })).toBe(false)
  })

  it('reports a fully capable browser as able', () => {
    expect(
      canRecord({
        MediaRecorder: function () {},
        HTMLCanvasElement: { prototype: { captureStream: () => {} } },
      }),
    ).toBe(true)
  })
})

describe('over-long input is caught before the wait, not after', () => {
  const words = (count: number) =>
    Array.from({ length: count }, () => 'word').join(' ')

  it('accepts input at the limit', () => {
    expect(isTooLong(words(MAX_INPUT_WORDS))).toBe(false)
  })

  it('rejects input past the limit', () => {
    expect(isTooLong(words(MAX_INPUT_WORDS + 1))).toBe(true)
  })

  it('accepts ordinary posts', () => {
    expect(isTooLong('We cut the build from 11 minutes to 40 seconds.')).toBe(
      false,
    )
  })
})

describe('right-to-left script is declined rather than mangled', () => {
  it.each([
    ['Hebrew', 'שלום עולם'],
    ['Arabic', 'مرحبا بالعالم'],
  ])('detects %s', (_name, text) => {
    expect(isRightToLeft(text)).toBe(true)
  })

  it.each([
    ['English', 'we shipped it'],
    ['accented Latin', 'café naïve résumé'],
    ['emoji', 'shipped it 🚀'],
  ])('does not flag %s', (_name, text) => {
    expect(isRightToLeft(text)).toBe(false)
  })
})

describe('every refusal says what to do next', () => {
  it('has nothing to say about ordinary text', () => {
    expect(describeProblem('We cut the build to 40 seconds.')).toBeNull()
  })

  it.each([
    ['empty input', ''],
    ['over-long input', Array.from({ length: 500 }, () => 'w').join(' ')],
    ['right-to-left input', 'שלום עולם'],
  ])('explains %s in a sentence a person can act on', (_name, text) => {
    const problem = describeProblem(text)

    expect(problem).not.toBeNull()
    expect(problem!.length).toBeGreaterThan(20)
  })
})

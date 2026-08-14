import { describe, expect, it } from 'vitest'
import { score } from './scorer'
import { compile } from './choreographer'
import { renderFrame } from './renderer'
import { DEFAULT_PRESET } from './presets'
import { recordingContext, type DrawCall } from './testing/recording-context'
import type { Preset } from './types'

const TEXT = 'we cut it to 40 seconds'

/** `into` is measured from the first phrase's onset — a fixed millisecond
 *  would now land in the lead-in silence before anything is on screen. */
const drawWith = (preset: Preset, into = 120): DrawCall[] => {
  const timeline = compile(score(TEXT), preset, { bpm: 120 })
  const { ctx, calls } = recordingContext()
  renderFrame(timeline, timeline.events[0]!.onsetMs + into, ctx, preset)
  return calls
}

const valuesSet = (calls: DrawCall[], property: string) =>
  calls
    .filter((call) => call.op === `set:${property}`)
    .map((call) => String(call.args[0]))

describe('a preset is data, not a code path', () => {
  it('draws a preset it has never seen before', () => {
    const invented: Preset = {
      ...DEFAULT_PRESET,
      id: 'invented',
      name: 'Invented',
      background: '#123456',
      color: '#abcdef',
      emphasisColor: '#fedcba',
    }

    const styles = valuesSet(drawWith(invented), 'fillStyle')

    expect(styles).toContain('#123456')
    expect(styles.some((s) => s === '#abcdef' || s === '#fedcba')).toBe(true)
  })

  it('does not vary its drawing by preset identity', () => {
    const alpha: Preset = { ...DEFAULT_PRESET, id: 'alpha', name: 'Alpha' }
    const beta: Preset = { ...DEFAULT_PRESET, id: 'beta', name: 'Beta' }

    expect(drawWith(alpha)).toEqual(drawWith(beta))
  })

  it('produces different drawing for presets that differ in look', () => {
    const other: Preset = {
      ...DEFAULT_PRESET,
      id: 'other',
      background: '#ffffff',
      color: '#000000',
      emphasisColor: '#ff0055',
    }

    expect(drawWith(other)).not.toEqual(drawWith(DEFAULT_PRESET))
  })

  it('takes its type stack from the preset', () => {
    const serif: Preset = { ...DEFAULT_PRESET, fontStack: 'Georgia, serif' }
    const fonts = valuesSet(drawWith(serif), 'font')

    expect(fonts.every((font) => font.includes('Georgia, serif'))).toBe(true)
  })

  it('takes its base size and emphasis scale from the preset', () => {
    const big: Preset = { ...DEFAULT_PRESET, baseFontPx: 200 }

    expect(drawWith(big)).not.toEqual(drawWith(DEFAULT_PRESET))
  })
})

describe('transition families absorb preset differences', () => {
  const withTransition = (transition: Preset['transition']): Preset => ({
    ...DEFAULT_PRESET,
    id: `t-${transition}`,
    transition,
  })

  it.each(['cut', 'fade', 'rise'] as const)(
    'renders the %s family without a preset-identity branch',
    (transition) => {
      const calls = drawWith(withTransition(transition))
      expect(calls.length).toBeGreaterThan(0)
    },
  )

  it('makes fade differ from cut partway into a phrase', () => {
    expect(drawWith(withTransition('fade'), 10)).not.toEqual(
      drawWith(withTransition('cut'), 10),
    )
  })
})

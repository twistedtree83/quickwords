import { describe, expect, it } from 'vitest'
import { score } from './scorer'
import { compile } from './choreographer'
import { DEFAULT_PRESET } from './presets'

describe('text becomes a timeline', () => {
  it('gives every word its own event on the timeline', () => {
    const timeline = compile(score('hello world'), DEFAULT_PRESET, { bpm: 120 })

    expect(timeline.events).toHaveLength(2)
    expect(timeline.durationMs).toBeGreaterThan(0)
  })
})

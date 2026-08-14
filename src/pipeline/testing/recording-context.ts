/**
 * A stand-in for CanvasRenderingContext2D that records what was asked of it.
 *
 * The Renderer is tested through the ordered log of draw calls and state
 * changes rather than through pixels: the log diffs readably, needs no browser,
 * and asserts the thing that actually matters — that a given timestamp always
 * produces the same drawing.
 */
export type DrawCall = { op: string; args: unknown[] }

const AVERAGE_GLYPH_WIDTH = 0.55

export function recordingContext(): {
  ctx: CanvasRenderingContext2D
  calls: DrawCall[]
} {
  const calls: DrawCall[] = []
  const state: Record<string, unknown> = {}

  const ctx = new Proxy(
    {},
    {
      get(_target, prop) {
        const key = String(prop)

        // Reads the Renderer legitimately needs answered, not recorded.
        if (key === 'measureText') {
          return (text: string) => {
            const size = Number.parseFloat(String(state.font ?? '16px')) || 16
            return { width: text.length * size * AVERAGE_GLYPH_WIDTH }
          }
        }
        if (key in state) return state[key]

        return (...args: unknown[]) => {
          calls.push({ op: key, args })
        }
      },
      set(_target, prop, value) {
        const key = String(prop)
        state[key] = value
        calls.push({ op: `set:${key}`, args: [value] })
        return true
      },
    },
  ) as unknown as CanvasRenderingContext2D

  return { ctx, calls }
}

/**
 * Pulls the pixel size out of a CSS font shorthand.
 *
 * `parseFloat` is wrong here: "700 120px system-ui" starts with the *weight*,
 * so it returns 700. A test that measured type that way would compare weights
 * while claiming to compare sizes, and would pass for the wrong reason.
 */
const FONT_SIZE = /(\d+(?:\.\d+)?)px/

export function fontPxFrom(font: unknown): number {
  const match = FONT_SIZE.exec(String(font))
  return match ? Number(match[1]) : 0
}

import { FRAME_HEIGHT, FRAME_WIDTH, SAFE_HEIGHT, SAFE_WIDTH } from './frame'
import type { Preset, TimelineEvent } from './types'

/**
 * Sets a phrase as type.
 *
 * Words wrap to fill the available width and emphasis is scaled up *inline*
 * rather than being given its own line. Stacking one word per line — the
 * previous behaviour — used about a third of a 1080px frame and read as a word
 * list rather than as a sentence.
 *
 * The whole phrase is solved to a single scale, so relative emphasis survives:
 * a long word shrinks the block rather than flattening the size difference
 * that makes emphasis readable.
 */

/** Short phrases scale up to fill the frame; long ones scale down to fit. */
const MAX_SCALE = 2.4
const MIN_SCALE = 0.3
const SOLVE_STEPS = 20
const FALLBACK_SPACE_RATIO = 0.28

export type SetWord = {
  event: TimelineEvent
  /** What to draw. Usually the whole word; a piece of it if it had to break. */
  text: string
  fontPx: number
  /** Centre of the piece — the Renderer draws with textAlign 'center'. */
  x: number
  width: number
}

export type SetLine = {
  words: SetWord[]
  width: number
  height: number
  /** Vertical centre of the line. */
  y: number
}

export type Measure = (text: string, fontPx: number, emphasis: boolean) => number

export function setPhrase(
  phrase: TimelineEvent[],
  preset: Preset,
  measure: Measure,
): SetLine[] {
  const scale = solveScale(phrase, preset, measure)
  return position(wrap(phrase, preset, scale, measure), preset)
}

export const sizeFor = (
  event: TimelineEvent,
  preset: Preset,
  scale: number,
): number =>
  (event.emphasis
    ? preset.baseFontPx * preset.emphasisScale
    : preset.baseFontPx) * scale

/**
 * The largest scale at which the phrase still fits the safe area.
 *
 * Binary search rather than stepping down from a fixed size, so short phrases
 * grow to fill the frame instead of sitting small in the middle of it. Fixed
 * iteration count keeps it deterministic, which the Renderer's statelessness
 * tests depend on.
 */
function solveScale(
  phrase: TimelineEvent[],
  preset: Preset,
  measure: Measure,
): number {
  const fits = (scale: number) => {
    const lines = wrap(phrase, preset, scale, measure)
    const widest = Math.max(...lines.map((line) => line.width))
    const tall = lines.reduce((sum, line) => sum + line.height, 0)

    return widest <= SAFE_WIDTH && tall <= SAFE_HEIGHT
  }

  if (fits(MAX_SCALE)) return MAX_SCALE

  let low = MIN_SCALE
  let high = MAX_SCALE
  for (let step = 0; step < SOLVE_STEPS; step++) {
    const mid = (low + high) / 2
    if (fits(mid)) low = mid
    else high = mid
  }

  return low
}

type RawLine = {
  words: Array<Omit<SetWord, 'x'>>
  width: number
  height: number
  spaceWidth: number
}

function wrap(
  phrase: TimelineEvent[],
  preset: Preset,
  scale: number,
  measure: Measure,
): RawLine[] {
  const spaceWidth = measure(' ', preset.baseFontPx * scale, false)

  const lines: RawLine[] = []
  let words: Array<Omit<SetWord, 'x'>> = []
  let width = 0

  const flush = () => {
    if (words.length === 0) return
    const tallest = Math.max(...words.map((word) => word.fontPx))
    lines.push({
      words,
      width,
      height: tallest * preset.lineHeightRatio,
      spaceWidth,
    })
    words = []
    width = 0
  }

  for (const event of phrase) {
    const fontPx = sizeFor(event, preset, scale)

    for (const piece of breakToFit(event, fontPx, measure)) {
      const pieceWidth = measure(piece, fontPx, event.emphasis)
      const gap = words.length > 0 ? spaceWidth : 0

      if (words.length > 0 && width + gap + pieceWidth > SAFE_WIDTH) flush()

      const lead = words.length > 0 ? spaceWidth : 0
      words.push({ event, text: piece, fontPx, width: pieceWidth })
      width += lead + pieceWidth
    }
  }

  flush()

  return lines.length > 0
    ? lines
    : [{ words: [], width: 0, height: 0, spaceWidth }]
}

/**
 * A token with nowhere to break — a URL, a hash — is broken across lines by
 * character rather than shrunk into illegibility. Scaling a 200-character URL
 * until it fits one line would put it at about 5px.
 */
function breakToFit(
  event: TimelineEvent,
  fontPx: number,
  measure: Measure,
): string[] {
  if (measure(event.text, fontPx, event.emphasis) <= SAFE_WIDTH) {
    return [event.text]
  }

  const pieces: string[] = []
  let current = ''

  for (const character of event.text) {
    const candidate = current + character
    if (
      current !== '' &&
      measure(candidate, fontPx, event.emphasis) > SAFE_WIDTH
    ) {
      pieces.push(current)
      current = character
    } else {
      current = candidate
    }
  }

  if (current !== '') pieces.push(current)

  return pieces
}

function position(lines: RawLine[], preset: Preset): SetLine[] {
  const totalHeight = lines.reduce((sum, line) => sum + line.height, 0)
  let top = FRAME_HEIGHT / 2 - totalHeight / 2

  return lines.map((line) => {
    const gap =
      line.spaceWidth || preset.baseFontPx * FALLBACK_SPACE_RATIO
    let cursor = FRAME_WIDTH / 2 - line.width / 2

    const words = line.words.map((word, index) => {
      if (index > 0) cursor += gap
      const x = cursor + word.width / 2
      cursor += word.width
      return { ...word, x }
    })

    const y = top + line.height / 2
    top += line.height

    return { words, width: line.width, height: line.height, y }
  })
}

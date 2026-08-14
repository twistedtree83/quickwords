import { SAFE_HEIGHT, SAFE_WIDTH } from './frame'
import {
  AVERAGE_GLYPH_WIDTH,
  BASE_FONT_PX,
  LINE_HEIGHT_RATIO,
} from './typography'

/**
 * How much text may share a frame.
 *
 * Derived from the safe area rather than picked, so the Scorer and the
 * Renderer cannot disagree about what fits. Two limits apply and the tighter
 * one wins.
 */

/** Words stack vertically, so the safe height sets how many can appear. */
const LINES_THAT_FIT = Math.floor(
  SAFE_HEIGHT / (BASE_FONT_PX * LINE_HEIGHT_RATIO),
)

const CHARS_PER_LINE = Math.floor(
  SAFE_WIDTH / (BASE_FONT_PX * AVERAGE_GLYPH_WIDTH),
)

/**
 * Geometry allows more than this — reading a phrase at scroll speed binds
 * tighter than fitting it does. Where the two disagree, comfort wins.
 */
const COMFORTABLE_WORDS = 5
const COMFORTABLE_CHARS = 30

export const MAX_PHRASE_WORDS = Math.min(COMFORTABLE_WORDS, LINES_THAT_FIT)

export const MAX_PHRASE_CHARS = Math.min(
  COMFORTABLE_CHARS,
  CHARS_PER_LINE * MAX_PHRASE_WORDS,
)

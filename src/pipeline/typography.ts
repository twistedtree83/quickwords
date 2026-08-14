/**
 * Type sizing, shared by the Renderer (which draws it), the budget (which
 * decides how much text may share a frame) and the test context (which has to
 * measure the same way the browser would).
 */

/** Starting size. Solved downward when a phrase will not fit. */
export const BASE_FONT_PX = 120

/** Below this, type on a phone stops being readable at scroll speed. */
export const MIN_FONT_PX = 44

/** Emphasis has to survive being seen on a phone, in a feed, while scrolling. */
export const EMPHASIS_SCALE = 1.4

export const LINE_HEIGHT_RATIO = 1.2

/**
 * Rough mean glyph width as a fraction of font size, for sans-serif Latin.
 * Only used where a real `measureText` is unavailable or where a budget has to
 * be estimated ahead of layout.
 */
export const AVERAGE_GLYPH_WIDTH = 0.55

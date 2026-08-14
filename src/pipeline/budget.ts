/**
 * How much text may share a frame.
 *
 * A phrase has to fit the safe area at a readable size on a phone screen.
 * Issue #7 derives these from the safe area itself; until then they are the
 * single place the limit is written down, so the Scorer and the Renderer
 * cannot disagree about it.
 */
export const MAX_PHRASE_CHARS = 30
export const MAX_PHRASE_WORDS = 5

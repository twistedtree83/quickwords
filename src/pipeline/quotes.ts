/**
 * Shared by the Scorer (which keeps a quoted span in one phrase) and by
 * emphasis (which lifts every word inside one). They must agree on where a
 * quote starts and ends, so the patterns live in one place.
 */
export const OPENS_QUOTE = /^["“]/
export const CLOSES_QUOTE = /["”][.,!?;:]*$/

/** A single word, with the Scorer's judgement of how much it matters. */
export type Word = {
  text: string
  /** 0..1. How much this word carries the sentence. */
  weight: number
  emphasis: boolean
}

/** A group of words that appear together on screen. */
export type Phrase = {
  words: Word[]
  /** 'hard' follows sentence-ending punctuation and buys a longer rest. */
  breakAfter: 'hard' | 'soft'
}

export type TimelineEvent = {
  wordId: number
  phraseIndex: number
  /** Carried on the event so the Renderer is a pure function of (timeline, t). */
  text: string
  emphasis: boolean
  onsetMs: number
  holdMs: number
  exitMs: number
}

/** Absolute time. The contract between Choreographer, Renderer and Capture. */
export type Timeline = {
  durationMs: number
  fps: number
  events: TimelineEvent[]
}

/**
 * How a phrase arrives on screen. A *family*, not a per-preset special case —
 * the Renderer may branch on this, and on nothing else about a preset.
 */
export type TransitionFamily = 'cut' | 'fade' | 'rise'

export type EasingFamily = 'linear' | 'outCubic'

/**
 * Every visual decision, as data.
 *
 * Adding a preset must be a new object in an array, never a new code path. If
 * a preset cannot be expressed without a conditional in the Renderer, the
 * model is missing an axis — extend it rather than branching.
 */
export type Preset = {
  id: string
  name: string

  background: string
  color: string
  emphasisColor: string

  fontStack: string
  weightOrdinary: number
  weightEmphasis: number
  baseFontPx: number
  emphasisScale: number
  lineHeightRatio: number

  transition: TransitionFamily
  easing: EasingFamily
}

export type CompileOptions = {
  bpm: number
}

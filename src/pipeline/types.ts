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

/** Every visual decision, as data. No renderer branches on preset identity. */
export type Preset = {
  id: string
  name: string
  background: string
  color: string
  emphasisColor: string
  fontStack: string
}

export type CompileOptions = {
  bpm: number
}

/**
 * The checks that stop someone wasting effort.
 *
 * All pure, and none of them touch the DOM, so the rules are testable without
 * a browser and the same rule can be applied while typing and again at render
 * time without drifting.
 */

/**
 * Roughly a minute and a half of video. Past this the render is a long wait for
 * something nobody will watch to the end.
 */
export const MAX_INPUT_WORDS = 120

/**
 * Scripts this renderer cannot set correctly. Canvas will happily draw them in
 * visual order with the words reversed, which produces a confident, wrong
 * video — worse than an honest refusal.
 */
const RTL_SCRIPTS =
  /[֐-׿؀-ۿ܀-ݏݐ-ݿހ-޿ࢠ-ࣿיִ-﷿ﹰ-﻿]/

type Capabilities = {
  MediaRecorder?: unknown
  HTMLCanvasElement?: { prototype?: { captureStream?: unknown } }
}

/**
 * Checked on arrival rather than after the text is pasted and Render is
 * pressed — being told at the end that it was never going to work is the
 * expensive version of this message.
 */
export function canRecord(scope: Capabilities): boolean {
  return (
    typeof scope.MediaRecorder === 'function' &&
    typeof scope.HTMLCanvasElement?.prototype?.captureStream === 'function'
  )
}

export const wordCount = (text: string) =>
  text.trim().split(/\s+/).filter(Boolean).length

export const isTooLong = (text: string) => wordCount(text) > MAX_INPUT_WORDS

export const isRightToLeft = (text: string) => RTL_SCRIPTS.test(text)

/**
 * One sentence saying what happened and what to do about it, or null when
 * there is nothing wrong. "Something went wrong" is not an option.
 */
export function describeProblem(text: string): string | null {
  if (text.trim().length === 0) {
    return 'Paste some text first — a sentence or two is enough to see what this does.'
  }

  if (isRightToLeft(text)) {
    return 'This only sets left-to-right scripts correctly, so it would give you a confidently wrong video. Right-to-left support is not built yet.'
  }

  if (isTooLong(text)) {
    return `That is ${wordCount(text)} words, and the limit is ${MAX_INPUT_WORDS} — trim it before rendering, or the wait will be longer than anyone will watch.`
  }

  return null
}

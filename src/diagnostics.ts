/**
 * What the last render actually did.
 *
 * A deliberate test seam. Recorded WebM does not carry reliable duration
 * metadata, so asserting "the render lasted as long as the timeline said"
 * cannot be done by decoding the file — it has to be reported by the code that
 * did the recording.
 */
export type RenderDiagnostics = {
  blob: Blob
  byteLength: number
  mimeType: string
  droppedFrames: number
  framesDrawn: number
  elapsedMs: number
  timelineDurationMs: number
  wordsDrawn: string[]
}

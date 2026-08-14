import type { Timeline } from './types'

export type Recording = {
  blob: Blob
  mimeType: string
  droppedFrames: number
  framesDrawn: number
  elapsedMs: number
}

/** Draws the frame for a given instant. Supplied by the caller so Capture
 *  never needs to know the Renderer exists. */
export type DrawFrame = (tMs: number) => void

/**
 * The one impure module: negotiate a format, drive a real-time loop, hand back
 * a Blob.
 *
 * Recording is real-time — the render takes as long as the video, which is the
 * whole basis of the product's speed promise. The accepted cost is that frames
 * can drop under load, so they are counted and reported rather than hidden.
 */
export async function record(
  canvas: HTMLCanvasElement,
  timeline: Timeline,
  draw: DrawFrame,
): Promise<Recording> {
  const stream = canvas.captureStream(timeline.fps)
  const recorder = new MediaRecorder(stream)

  const chunks: Blob[] = []
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data)
  }
  const stopped = new Promise<void>((resolve) => {
    recorder.onstop = () => resolve()
  })

  // Draw the opening frame before recording starts, so the video does not begin
  // on an empty canvas.
  draw(0)

  const startedAt = performance.now()
  recorder.start()

  let framesDrawn = 0
  await new Promise<void>((resolve) => {
    const tick = () => {
      const elapsed = performance.now() - startedAt
      if (elapsed >= timeline.durationMs) {
        resolve()
        return
      }
      draw(elapsed)
      framesDrawn += 1
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })

  const elapsedMs = performance.now() - startedAt
  recorder.stop()
  await stopped

  const mimeType = recorder.mimeType
  const expectedFrames = Math.round((timeline.durationMs / 1000) * timeline.fps)

  return {
    blob: new Blob(chunks, { type: mimeType }),
    mimeType,
    droppedFrames: Math.max(0, expectedFrames - framesDrawn),
    framesDrawn,
    elapsedMs,
  }
}

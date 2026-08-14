import { score } from './pipeline/scorer'
import { compile } from './pipeline/choreographer'
import { renderFrame, wordsVisibleAt } from './pipeline/renderer'
import { record } from './pipeline/capture'
import { DEFAULT_PRESET } from './pipeline/presets'
import type { RenderDiagnostics } from './diagnostics'

declare global {
  interface Window {
    __kinetic?: RenderDiagnostics
  }
}

const textarea = document.querySelector<HTMLTextAreaElement>('#text')!
const renderButton = document.querySelector<HTMLButtonElement>('#render')!
const status = document.querySelector<HTMLParagraphElement>('#status')!
const canvas = document.querySelector<HTMLCanvasElement>('#preview')!
const ctx = canvas.getContext('2d')!

const BPM = 120

renderButton.addEventListener('click', async () => {
  const text = textarea.value.trim()
  if (text.length === 0) {
    status.textContent = 'Paste some text first.'
    return
  }

  const timeline = compile(score(text), DEFAULT_PRESET, { bpm: BPM })

  renderButton.disabled = true
  status.textContent = 'Recording…'

  const wordsDrawn = new Set<string>()
  const recording = await record(canvas, timeline, (tMs) => {
    renderFrame(timeline, tMs, ctx, DEFAULT_PRESET)
    for (const event of wordsVisibleAt(timeline, tMs)) wordsDrawn.add(event.text)
  })

  window.__kinetic = {
    blob: recording.blob,
    byteLength: recording.blob.size,
    mimeType: recording.mimeType,
    droppedFrames: recording.droppedFrames,
    framesDrawn: recording.framesDrawn,
    elapsedMs: recording.elapsedMs,
    timelineDurationMs: timeline.durationMs,
    wordsDrawn: [...wordsDrawn],
  }

  download(recording.blob, recording.mimeType)

  renderButton.disabled = false
  status.textContent = `Done — ${(recording.blob.size / 1024).toFixed(0)} KB, ${recording.mimeType}, ${recording.droppedFrames} dropped frames.`
})

function download(blob: Blob, mimeType: string): void {
  const extension = mimeType.includes('mp4') ? 'mp4' : 'webm'
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `kinetic.${extension}`
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

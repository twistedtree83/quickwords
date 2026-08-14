import { score } from './pipeline/scorer'
import { compile } from './pipeline/choreographer'
import { renderFrame, wordsVisibleAt } from './pipeline/renderer'
import { record, type Recording } from './pipeline/capture'
import { extensionFor, isAwkwardToUpload } from './pipeline/formats'
import { DEFAULT_PRESET } from './pipeline/presets'
import { mountPicker } from './picker'
import type { RenderDiagnostics } from './diagnostics'

declare global {
  interface Window {
    __kinetic?: RenderDiagnostics
  }
}

const textarea = document.querySelector<HTMLTextAreaElement>('#text')!
const renderButton = document.querySelector<HTMLButtonElement>('#render')!
const status = document.querySelector<HTMLParagraphElement>('#status')!
const picker = document.querySelector<HTMLFieldSetElement>('#picker')!
const tempo = document.querySelector<HTMLInputElement>('#tempo')!
const tempoValue = document.querySelector<HTMLOutputElement>('#tempo-value')!
const canvas = document.querySelector<HTMLCanvasElement>('#preview')!
const ctx = canvas.getContext('2d')!

let preset = DEFAULT_PRESET

const bpm = () => Number(tempo.value)
const sampleText = () => textarea.value.trim() || 'paste your text'

/** Preview only — no file is produced, so pace can be judged before rendering. */
function updatePreview(): void {
  const timeline = compile(score(sampleText()), preset, { bpm: bpm() })
  const first = timeline.events[0]
  renderFrame(timeline, first ? first.onsetMs + first.holdMs / 2 : 0, ctx, preset)
  tempoValue.textContent = `${bpm()} bpm · ${(timeline.durationMs / 1000).toFixed(1)}s`
}

mountPicker(picker, preset.id, (chosen) => {
  preset = chosen
  updatePreview()
})

tempo.addEventListener('input', updatePreview)
textarea.addEventListener('input', updatePreview)
updatePreview()

renderButton.addEventListener('click', async () => {
  const text = textarea.value.trim()
  if (text.length === 0) {
    status.textContent = 'Paste some text first.'
    return
  }

  const timeline = compile(score(text), preset, { bpm: bpm() })

  renderButton.disabled = true
  status.textContent = 'Recording…'

  // Canvas silently substitutes a fallback for a web font that has not
  // finished loading: the preview looks right, the video looks wrong, and
  // nothing anywhere reports a problem. Gate the first draw on it.
  await document.fonts.ready
  const fontsReadyAtFirstDraw = document.fonts.status === 'loaded'

  const wordsDrawn = new Set<string>()
  const recording = await record(canvas, timeline, (tMs) => {
    renderFrame(timeline, tMs, ctx, preset)
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
    fontsReadyAtFirstDraw,
  }

  download(recording.blob, recording.mimeType)

  renderButton.disabled = false
  status.textContent = describe(recording)
})

function describe(recording: Recording): string {
  const size = `${(recording.blob.size / 1024).toFixed(0)} KB`
  const parts = [`Done — ${extensionFor(recording.mimeType)}, ${size}.`]

  if (isAwkwardToUpload(recording.mimeType)) {
    parts.push(
      'This browser can only record WebM. The file works, but some platforms reject it — Chrome or Safari will give you an MP4.',
    )
  }
  if (recording.droppedFrames > 0) {
    parts.push(
      `${recording.droppedFrames} frames dropped — worth re-rendering if it looks uneven.`,
    )
  }

  return parts.join(' ')
}

function download(blob: Blob, mimeType: string): void {
  const extension = extensionFor(mimeType)
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `kinetic.${extension}`
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

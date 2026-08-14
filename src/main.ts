import { score } from './pipeline/scorer'
import { compile } from './pipeline/choreographer'
import { renderFrame, wordsVisibleAt } from './pipeline/renderer'
import { record, type Recording } from './pipeline/capture'
import { extensionFor, isAwkwardToUpload } from './pipeline/formats'
import { DEFAULT_PRESET, presetById } from './pipeline/presets'
import { canRecord, describeProblem } from './pipeline/guards'
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
const savedLink = document.querySelector<HTMLAnchorElement>('#saved-link')!
const savedLinkWrap = document.querySelector<HTMLParagraphElement>('#saved-link-wrap')!
const canvas = document.querySelector<HTMLCanvasElement>('#preview')!
const ctx = canvas.getContext('2d')!

/** Only the two choices persist. No accounts, no saved projects, no history. */
const REMEMBERED = { preset: 'kinetic.preset', tempo: 'kinetic.tempo' } as const

const remembered = (key: string): string | null => {
  try {
    return localStorage.getItem(key)
  } catch {
    // Private browsing or blocked storage: a forgotten preference is not worth
    // breaking the page over.
    return null
  }
}

const remember = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* see above */
  }
}

let preset = presetById(remembered(REMEMBERED.preset) ?? DEFAULT_PRESET.id)
tempo.value = remembered(REMEMBERED.tempo) ?? tempo.value

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
  remember(REMEMBERED.preset, chosen.id)
  updatePreview()
})

tempo.addEventListener('input', () => {
  remember(REMEMBERED.tempo, tempo.value)
  updatePreview()
})
textarea.addEventListener('input', () => {
  updatePreview()
  // Warn while typing, so an over-long post is trimmed before the wait rather
  // than discovered after it.
  const problem = describeProblem(textarea.value)
  status.textContent = textarea.value.trim() === '' ? '' : (problem ?? '')
})
updatePreview()

// Checked on arrival, not after the text is pasted and Render is pressed.
if (!canRecord(window)) {
  renderButton.disabled = true
  status.textContent =
    'This browser cannot record video from a canvas, so Kinetic cannot make you a file. Chrome or Safari will work.'
}

/** Guards re-entry: a second press must not start an overlapping recording. */
let rendering = false

renderButton.addEventListener('click', async () => {
  if (rendering) return

  // Snapshotted here: everything downstream uses this text, so editing the
  // textarea mid-render cannot produce a file that is half one draft and half
  // another.
  const text = textarea.value.trim()

  const problem = describeProblem(text)
  if (problem !== null) {
    status.textContent = problem
    return
  }

  const timeline = compile(score(text), preset, { bpm: bpm() })

  rendering = true
  renderButton.disabled = true
  status.textContent = 'Recording…'

  // rAF throttles in a background tab, which can silently truncate or stretch
  // a real-time recording. Noticed and reported rather than hidden.
  let backgrounded = false
  const watchVisibility = () => {
    if (document.hidden) backgrounded = true
  }
  document.addEventListener('visibilitychange', watchVisibility)

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

  document.removeEventListener('visibilitychange', watchVisibility)

  download(recording.blob, recording.mimeType)

  rendering = false
  renderButton.disabled = false
  status.textContent = backgrounded
    ? 'Done, but the tab was in the background during the render, which can drop or stretch frames. Worth re-rendering with this tab visible.'
    : describe(recording)
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

let lastObjectUrl: string | null = null

function download(blob: Blob, mimeType: string): void {
  const filename = `kinetic.${extensionFor(mimeType)}`

  if (lastObjectUrl !== null) URL.revokeObjectURL(lastObjectUrl)
  const url = URL.createObjectURL(blob)
  lastObjectUrl = url

  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.append(anchor)
  anchor.click()
  anchor.remove()

  // The URL is deliberately not revoked here: a dismissed download prompt
  // would otherwise cost the whole render, so the link stays live.
  savedLink.href = url
  savedLink.download = filename
  savedLinkWrap.hidden = false
}
